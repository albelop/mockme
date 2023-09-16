import { describe, it, expect, beforeAll, vi } from "vitest";

import getPackageInfo from "../utils/getPackageInfo.js";
import { buildCLI } from "../cli.js";

async function cli(args = [], options = {}) {
  const response = {
    stdout: "",
    stderr: "",
    error: "",
  };
  try {
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
      .parseAsync(args, { from: "user" });
    return response;
  } catch (error) {
    response.error = error.message;
    return response;
  }
}
describe("CLI Commands", () => {
  let packageInfo = {};

  beforeAll(() => {
    packageInfo = getPackageInfo();
  });

  it("should output the right version", async () => {
    const result = await cli(["-v"]);

    expect(result.stdout).toBe(`${packageInfo.version}`);
  });

  it("should call create action with config file set to mockme.config.js", async () => {
    const createAction = vi.fn();
    await cli([], { createAction });
    expect(createAction.mock.lastCall).toContainEqual({
      config: "mockme.config.js",
    });
  });

  it("should call create action with custom config file using -c option", async () => {
    const createAction = vi.fn();
    const configFileName = "test";
    await cli(["-c", configFileName], { createAction });
    expect(createAction.mock.lastCall).toContainEqual({
      config: configFileName,
    });
  });

  it("should call create action with custom config file using -c option", async () => {
    const createAction = vi.fn();
    const configFileName = "test";
    await cli(["--config", configFileName], { createAction });
    expect(createAction.mock.lastCall).toContainEqual({
      config: configFileName,
    });
  });

  it("should output config file not found", async () => {
    const result = await cli();

    expect(result.error).toBe("mockme.config.js was not found.");
  });
});
