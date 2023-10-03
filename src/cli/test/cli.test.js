import {afterEach, beforeAll, describe, expect, it, vi} from "vitest";

import {buildCLI} from "../cli.js";
import { version } from "../utils/getPackageInfo.js";

async function cli(args = [], options = {}) {
    const response = {
        stdout: "",
        stderr: "",
        error: "",
    };

    try {
        // @ts-ignore
        await buildCLI(options)
            .configureOutput({
                writeOut(str) {
                    response.stdout = str.trim();
                },
                writeErr(str) {
                    response.stderr = str.trim();
                },
                outputError(str) {
                    response.error = str.trim();
                },
            })
            .exitOverride()
            .parseAsync(args, {from: "user"});

        return response;
    } catch (error) {
        response.error = error.message;

        return response;
    }
}

describe("CLI Commands", () => {

    beforeAll(() => {
        process.env.MOCKME_TEST = "1";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should output the right version", async () => {
        const result = await cli(["-v"]);

        expect(result.stdout).toBe(version);
    });

    it("should call create action with config file set to mockme.config.mjs", async () => {
        const createAction = vi.fn();

        await cli([], {createAction: () => createAction});

        expect(createAction.mock.lastCall).toContainEqual({
            config: "mockme.config.mjs",
        });
    });

    it("should call create action with custom config file using -c option", async () => {
        const createAction = vi.fn();
        const configFileName = "test";

        await cli(["-c", configFileName], {createAction: () => createAction});

        expect(createAction.mock.lastCall).toContainEqual({
            config: configFileName,
        });
    });

    it("should output config file not found", async () => {
        const result = await cli();

        expect(result.error).toContain("Could not find config file at");
    });
});

describe("Plugins", () => {
    it("should not create the service worker if there are no plugins", async () => {
        const result = await cli(["-c", "src/cli/test/mockme.config.mjs"]);

        expect(result.error).toBe(
            "Nothing to be processed. The output was not generated."
        );
    });

    it("should not error if there is one plugin at least", async () => {
        const result = await cli([], {
            config: {
                output: "src/cli/test/outputs/.storybook/service-worker.plugins.js",
                plugins: [{
                    name: "mockme-plugin-test",
                    handler: () => Promise.resolve({}),
                }],
            },
        });

        expect(result.error).not.toBe(
            "Nothing to be processed. The output was not generated."
        );
    });

    it("should call the plugin handler", async () => {
        const plugin =  {
            name: "mockme-plugin-test",
            handler: vi.fn(),
        };

        await cli(["-c", "src/cli/test/mockme.config.mjs"], {
            config: {
                output: "src/cli/test/outputs/.storybook/service-worker.plugins.js",
                plugins: [plugin],
            },
        });

        expect(plugin.handler).toHaveBeenCalled();
    });

    it("should call all the plugin handlers", async () => {
        const pluginA = {
            name: "mockme-plugin-testA",
            handler: vi.fn(),
        };
        const pluginB = {
            name: "mockme-plugin-testB",
            handler: vi.fn(),
        };

        await cli(["-c", "src/cli/test/mockme.config.mjs"], {
            config: {
                output: "src/cli/test/outputs/.storybook/service-worker.plugins.js",
                plugins: [pluginA, pluginB],
            },
        });

        expect(pluginA.handler).toHaveBeenCalled();
        expect(pluginB.handler).toHaveBeenCalled();
    });

    it("should have plugin config available in the plugin handler", async () => {
        const logSpy = vi.spyOn(console, "log");
        const plugin = ({ test }) => ({
            name: "mockme-plugin-test",
            handler: () => {
                console.log(test);
            },
        });

        await cli(["-c", "src/cli/test/mockme.config.mjs"], {
            config: {
                output: "src/cli/test/outputs/.storybook/service-worker.plugins.js",
                plugins: [plugin({test: "test-config"})],
            },
        });

        expect(logSpy).toHaveBeenCalledWith("test-config");
    });
});
