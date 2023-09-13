#! /usr/bin/env node

import { program } from "commander";
import getPackageInfo from "./utils/getPackageInfo.js";
import createMocksAction from "./createMocksAction.js";

const { name, description, version } = getPackageInfo();

program
  .name(name)
  .description(description)
  .version(version)
  .option(
    "-c, --config <config>",
    "path to the configuration file",
    "mockme.config.js"
  )
  .action(createMocksAction)
  .parse();
