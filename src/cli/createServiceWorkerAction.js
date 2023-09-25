import { dirname, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import * as esbuild from "esbuild";

import { mockSchema } from "../schemas.js";

export default function createServiceWorkerAction(customConfig) {
  return async function ({ config: configFileName }, command) {
    let fileConfig = {};
    try {
      // 1. Read config from file or use custom config.
      fileConfig = (await import(join(process.cwd(), configFileName)))?.default;
    } catch (error) {
      throw Error(
        `Could not find config file at ${join(process.cwd(), configFileName)}`
      );
    }
    // @ts-ignore
    const { plugins, output } = { ...fileConfig, ...customConfig };

    try {
      // 2. Check there are plugins to start the process.
      if (!plugins?.length) {
        throw Error("Nothing to be processed. The output was not generated.");
      }

      // 3. Collect mocks from the plugins execution.
      const pluginsMocks = await getMocksFromPlugins(plugins);

      // 4. Filter mocks with only those with a valid mock schema.
      const mocks = filterMocksWithValidSchema(pluginsMocks, mockSchema);

      // 5. Cast the mocks structure into a string creating a map for functions.
      const { mocksString, functionReplacements } = generateMocksString(mocks);

      // 6. Create the js content for the mock service.
      const serviceWorkerJSContent = generateServiceWorkerContent(
        mocksString,
        functionReplacements
      );

      // 7. Build the content using esbuild.
      const fileContent = await buildContent(serviceWorkerJSContent);

      // 8. Output the content to the destination file.
      await writeServiceWorkerFile(output, fileContent);
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

async function getMocksFromPlugins(plugins = []) {
  return Promise.all(
    plugins.map(({ handler }) => Promise.resolve().then(() => handler?.()))
  );
}

function filterMocksWithValidSchema(mocks, schema) {
  return mocks
    .filter((x) => x)
    .flat()
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

  return { mocksString, functionReplacements };
}

function generateServiceWorkerContent(string, replacements) {
  const content = `import { sw } from "@betheweb/mockme";
  sw(self, [replaceMe]);`;
  const stringWithReplacements = Object.keys(replacements).reduce(
    (result, key) => {
      return result.replace(`"${key}"`, replacements[key].toString());
    },
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

  console.log(process.cwd());

  if (process.env.MOCKME_TEST) {
    esbuildOptions.alias = {
      "@betheweb/mockme": "./src/index.js",
    };
  }
  // @ts-ignore
  let { outputFiles } = await esbuild.build(esbuildOptions);

  // @ts-ignore
  return outputFiles[0].text;
}

async function writeServiceWorkerFile(output, content) {
  await mkdir(dirname(output), { recursive: true });
  await writeFile(join(process.cwd(), output), content, "utf-8");
}
