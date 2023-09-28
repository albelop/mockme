export default class ConsoleLogger {
  #prefix;

  constructor(prefix) {
    this.#prefix = prefix;
  }

  #buildMessage(message) {
    return [this.#prefix, message].filter((x) => x).join(" ");
  }

  log(message) {
    console.log(`[LOG] ${this.#buildMessage(message)}`);
  }
  warn(message) {
    console.warn(`[WARN] ${this.#buildMessage(message)}`);
  }
  error(message) {
    console.error(`[ERROR] ${this.#buildMessage(message)}`);
  }
}
