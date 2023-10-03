import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
    readFileSync(join(__dirname, '../../../package.json'), {
      encoding: "utf8",
    })
);

export const version = packageJson.version;
export const description = packageJson.description;
export default packageJson;
