import fs from "node:fs";
import { join } from "node:path";

export default function getPackageInfo(packageJsonPath = "package.json") {
  try {
    return JSON.parse(
      fs.readFileSync(join(process.cwd(), packageJsonPath), {
        encoding: "utf8",
      })
    );
  } catch {
    return {};
  }
}
