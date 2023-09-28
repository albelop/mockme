import { describe, it, expect, vi } from "vitest";
import { useLogger } from "../logger.js";
import FileLogger from "../loggers/FileLogger.js";
import ConsoleLogger from "../loggers/ConsoleLogger.js";

describe("logger", () => {
  it("should return an console as logger by default", () => {
    expect(useLogger()).toBeInstanceOf(ConsoleLogger);
  });

  it("should return an instance of FileLogger if config has log.outdir", () => {
    // @ts-ignore
    expect(useLogger({ outdir: "./src/test/outputs/" })).toBeInstanceOf(
      FileLogger
    );
  });

  describe("FileLogger", () => {
    it("should call writeFn with the mesaage prefixed with [LOG] when log", () => {
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", undefined, writeSpy);
      const message = "message";

      logger.log(message);

      expect(writeSpy.mock.lastCall).toContain(`[LOG] ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [WARN] when warn", () => {
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", undefined, writeSpy);
      const message = "message";

      logger.warn(message);

      expect(writeSpy.mock.lastCall).toContain(`[WARN] ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [ERROR] when error", () => {
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", undefined, writeSpy);
      const message = "message";

      logger.error(message);

      expect(writeSpy.mock.lastCall).toContain(`[ERROR] ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [LOG] and  prefix when log", () => {
      const prefix = "[prefix]";
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", prefix, writeSpy);
      const message = "message";

      logger.log(message);

      expect(writeSpy.mock.lastCall).toContain(`[LOG] ${prefix} ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [WARN] and prefix when warn", () => {
      const prefix = "[prefix]";
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", prefix, writeSpy);
      const message = "message";

      logger.warn(message);

      expect(writeSpy.mock.lastCall).toContain(`[WARN] ${prefix} ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [ERROR] and prefix when error", () => {
      const prefix = "[prefix]";
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", prefix, writeSpy);
      const message = "message";

      logger.error(message);

      expect(writeSpy.mock.lastCall).toContain(
        `[ERROR] ${prefix} ${message}\n`
      );
    });

    it("should create the log file if it does not exist", () => {
      const logger = new FileLogger("./src/test/outputs");
      logger.log("this is the message");
    });
  });

  describe("ConsoleLogger", () => {
    it("should create an instance", () => {
      expect(new ConsoleLogger()).toBeInstanceOf(ConsoleLogger);
    });

    it("should call console.log with the right message", () => {
      const logSpy = vi.fn();
      console.log = logSpy;
      const logger = new ConsoleLogger();
      const message = "message";

      logger.log(message);

      expect(logSpy).toBeCalledWith(`[LOG] ${message}`);
    });

    it("should call console.warn with the right message", () => {
      const warnSpy = vi.fn();
      console.warn = warnSpy;
      const logger = new ConsoleLogger();
      const message = "message";

      logger.warn(message);

      expect(warnSpy).toBeCalledWith(`[WARN] ${message}`);
    });

    it("should call console.error with the right message", () => {
      const errorSpy = vi.fn();
      console.error = errorSpy;
      const logger = new ConsoleLogger();
      const message = "message";

      logger.error(message);

      expect(errorSpy).toBeCalledWith(`[ERROR] ${message}`);
    });
  });
});
