import { ConsoleFactory } from './ConsoleFactory.js';
import { Logger } from './loggers/Logger.js';
import { PrefixedLogger } from './loggers/PrefixedLogger.js';

export class LoggerFactory {
  static get(
    {
      prefix,
    } = {},
    {
      console = ConsoleFactory.get(),
    } = {},
  ) {
    if (prefix) {
      return LoggerFactory.#createPrefixedLogger(console, prefix);
    }

    return LoggerFactory.#createLogger(console);
  }

  static #createLogger(console) {
    return new Logger(console);
  }

  static #createPrefixedLogger(console, prefix) {
    return new PrefixedLogger({
      prefix,
      logger: LoggerFactory.#createLogger(console),
    });
  }
}
