import nodeConsole from 'node:console';

export class Logger {
  #console;

  constructor(console = nodeConsole) {
    this.#console = console;
  }

  log(message, ...args) {
    this.#console.log(`[LOG] ${message}`, ...args);
  }

  warn(message, ...args) {
    this.#console.warn(`[WARN] ${message}`, ...args);
  }

  error(message, ...args) {
    this.#console.error(`[ERROR] ${message}`, ...args);
  }
}
