import * as esbuild from "esbuild";
import {mkdir, writeFile} from "node:fs/promises";
import {dirname, join} from "node:path";

import {mockSchema} from "../schemas.js";
import {LoggerFactory} from "../LoggerFactory.js";
import {ConsoleFactory} from "../ConsoleFactory.js";

/**
 * Reads the config from a file or use a custom config.
 *
 * @param {string} configFileName
 * @returns {Promise<*>}
 */
const getConfig = async configFileName => {
    try {
        return (await import(join(process.cwd(), configFileName)))?.default;
    } catch (error) {
        throw Error(
            `Could not find config file at ${join(process.cwd(), configFileName)}`
        );
    }
};

export default function createServiceWorkerAction(customConfig) {
    return async function ({config: configFileName}, command) {
        const fileConfig = await getConfig(configFileName);
        const {plugins, output, scenarios, logDir} = {
            ...fileConfig,
            ...customConfig,
        };

        try {
            // Check there are plugins to start the process.
            if (!plugins?.length) {
                throw Error("Nothing to be processed. The output was not generated.");
            }

            // Create the logger
            const logger = (prefix) => LoggerFactory.get({
                    prefix
                },
                {
                    console: ConsoleFactory.get({
                        outputDirectory: logDir,
                    })
                });

            // Collect mocks from the plugins execution.
            const pluginsMocks = await getMocksFromPlugins(plugins, logger);

            // Filter mocks with only those with a valid mock schema.
            const mocks = filterMocksWithValidSchema(pluginsMocks, mockSchema);

            // Extract scenario content to include in the scenarios file.
            const scenariosContent = generateScenariosString(mocks);

            // Cast the mocks structure into a string creating a map for functions.
            const {mocksString, functionReplacements} = generateMocksString(mocks);

            // Create the js content for the mock service.
            const serviceWorkerJSContent = generateServiceWorkerContent(
                mocksString,
                functionReplacements
            );

            // Build the content using esbuild.
            const fileContent = await buildContent(serviceWorkerJSContent);

            // Output the content to the destination file.
            await writeServiceWorkerFile(output, fileContent);
            await writeScenariosFile(scenarios.output, scenariosContent);
        } catch (error) {
            command.error(error.message);
        }
    };
}

function mockKey(mock) {
    return [
        mock.request.method,
        mock.request.path,
        mock.scenario,
        JSON.stringify(mock.request.conditions || "default"),
    ]
        .filter((x) => x)
        .join("--")
        .toLowerCase();
}

async function getMocksFromPlugins(plugins = [], logger) {
    const mocks = await Promise.all(
        plugins.map(({name, handler}) =>
            Promise.resolve().then(() => handler?.({logger: logger(name)}))
        )
    );

    return mocks.flat();
}

function filterMocksWithValidSchema(mocks, schema) {
    return mocks
        .flat()
        .filter((x) => x)
        .map(schema.parse.bind(schema))
        .reduce((result, mock) => {
            result.set(mockKey(mock), mock);

            return result;
        }, new Map());
}

function generateMocksString(mocks = []) {
    const functionReplacements = {};

    const mocksString = JSON.stringify([...mocks.values()], (_, value) => {
        if (typeof value === "function") {
            const fnKey = `Fn_${Object.keys(functionReplacements).length}`;

            functionReplacements[fnKey] = value;

            return fnKey;
        }

        return value;
    });

    return {mocksString, functionReplacements};
}

function generateScenariosString(mocks = []) {
    const scenarios = [...mocks.values()].reduce((result, {scenario}) => {
        if (Boolean(scenario)) {
            result.push(scenario);
        }

        return result;
    }, []);

    return `export default ${JSON.stringify(scenarios)};`;
}

function generateServiceWorkerContent(string, replacements) {
    const content = `import { sw } from "@betheweb/mockme";
  sw(self, [replaceMe]);`;

    const stringWithReplacements = Object.keys(replacements).reduce(
        (result, key) => result.replace(`"${key}"`, replacements[key].toString()),
        string
    );

    return content.replace("[replaceMe]", stringWithReplacements);
}

async function buildContent(contents) {
    const esbuildOptions = {
        stdin: {
            contents,
            loader: "ts",
            resolveDir: ".",
        },
        bundle: true,
        write: false,
        format: "esm",
    };

    if (process.env.MOCKME_TEST) {
        esbuildOptions.alias = {
            "@betheweb/mockme": "./src/index.js",
        };
    }
    // @ts-ignore
    let {outputFiles} = await esbuild.build(esbuildOptions);

    // @ts-ignore
    return outputFiles[0].text;
}

async function writeServiceWorkerFile(output, content) {
    await mkdir(dirname(output), {recursive: true});
    await writeFile(join(process.cwd(), output), content, "utf-8");
}

async function writeScenariosFile(output, content) {
    if (!output) {
        return;
    }

    const dir = dirname(output);

    await mkdir(dir, {recursive: true});
    await writeFile(join(process.cwd(), dir, "scenarios.js"), content, "utf-8");
}
