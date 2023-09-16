import { Command } from "commander";
import getPackageInfo from "./utils/getPackageInfo.js";
import createMocksAction from "./createMocksAction.js";

const { name, description, version } = getPackageInfo();

export function buildCLI({ createAction = createMocksAction } = {}) {
  return new Command()
    .name(name)
    .description(description)
    .version(version, "-v, --version")
    .option(
      "-c, --config <config>",
      "path to the configuration file",
      "mockme.config.js"
    )
    .action(createAction)
    .showHelpAfterError();
}
