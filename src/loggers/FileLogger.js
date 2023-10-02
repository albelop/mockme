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
  #prefix;
  #writeFn;

  constructor(
    outdir = join(os.homedir(), ".mockme"),
    prefix,
    writeFn = appendFileSync
  ) {
    this.#outdir = outdir;
    this.#prefix = prefix;
    this.#writeFn = writeFn;
  }

  #buildMessage(message) {
    return [this.#prefix, message].filter((x) => x).join(" ") + "\n";
  }

  log(message) {
    this.#write(`[LOG] ${this.#buildMessage(message)}`);
  }

  warn(message) {
    this.#write(`[WARN] ${this.#buildMessage(message)}`);
  }

  error(message) {
    this.#write(`[ERROR] ${this.#buildMessage(message)}`);
  }

  async #write(message) {
    try {
      mkdirSync(this.#outdir, { recursive: true });
      this.#writeFn(join(this.#outdir, getLogFileName()), message, "utf8");
    } catch (error) {
      console.log(error);
    }
  }
}
