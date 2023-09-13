import fs from "node:fs";
import { join } from "node:path";

export default function getPackageInfo() {
  try {
    return JSON.parse(
      fs.readFileSync(join(process.cwd(), "package.json"), { encoding: "utf8" })
    );
  } catch {
    return {};
  }
}
