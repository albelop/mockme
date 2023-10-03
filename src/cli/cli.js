import {Command} from "commander";
import createServiceWorkerAction from "./createServiceWorkerAction.js";
import { description, version } from "./utils/getPackageInfo.js";

export const buildCLI = ({
                             createAction = createServiceWorkerAction,
                             config: customConfig = {},
                         } = {}) => new Command()
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
