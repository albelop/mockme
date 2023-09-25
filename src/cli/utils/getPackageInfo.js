import fs from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function getPackageInfo(packageJsonPath = "package.json") {
  try {
    return JSON.parse(
      fs.readFileSync(join(__dirname, '../../../', packageJsonPath), {
        encoding: "utf8",
      })
    );
  } catch {
    return {};
  }
}
