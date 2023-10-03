export class PrefixedLogger {
  /** @type {string} */
  #prefix;

  /** @type {Logger} */
  #logger;

  constructor({
      logger,
      prefix,
              } = {}) {
    this.#logger = logger;
    this.#prefix = prefix;
  }

  log(message, ...args) {
    this.#logger.log(`${this.#prefix} ${message}`, ...args);
  }

  warn(message, ...args) {
    this.#logger.warn(`${this.#prefix} ${message}`, ...args);
  }

  error(message, ...args) {
    this.#logger.error(`${this.#prefix} ${message}`, ...args);
  }
}
