import { Command } from "commander";
import createServiceWorkerAction from "./createServiceWorkerAction.js";
import getPackageInfo from "./utils/getPackageInfo.js";

const { description, version } = getPackageInfo();

export function buildCLI({
  createAction = createServiceWorkerAction,
  config: customConfig = {},
} = {}) {
  return new Command()
    .name("mockme")
    .description(description)
    .version(version, "-v, --version")
    .option(
      "-c, --config <config>",
      "path to the configuration file",
      "mockme.config.mjs"
    )
    .action(createAction(customConfig))
    .showHelpAfterError();
}
