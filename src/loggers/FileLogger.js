import os from "node:os";
import { join } from "node:path";
import { appendFileSync, mkdirSync } from "node:fs";

function getLogFileName() {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  return `${["log", year, month, day].join("-")}.txt`;
}

export default class FileLogger {
  #outdir;
  #writeFn;

  constructor(
    outdir = join(os.homedir(), ".mockme"),
    writeFn = appendFileSync
  ) {
    this.#outdir = outdir;
    this.#writeFn = writeFn;
  }

  log(message) {
    this.#write(`[LOG] ${message}`);
  }
  warn(message) {
    this.#write(`[WARN] ${message}`);
  }
  error(message) {
    this.#write(`[ERROR] ${message}`);
  }

  async #write(message) {
    try {
      mkdirSync(this.#outdir, { recursive: true });
      this.#writeFn(
        join(this.#outdir, getLogFileName()),
        message + "\n",
        "utf8"
      );
    } catch (error) {
      console.log(error);
    }
  }
}
