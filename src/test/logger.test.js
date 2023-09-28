import { describe, it, expect, vi } from "vitest";
import { useLogger } from "../logger.js";
import FileLogger from "../loggers/FileLogger.js";

describe("logger", () => {
  it("should return an console as logger by default", () => {
    expect(useLogger()).toBe(console);
  });

  it("should return an instance of FileLogger if config has log.outdir", () => {
    expect(useLogger("./src/test/outputs/")).toBeInstanceOf(FileLogger);
  });

  describe("FileLogger", () => {
    it("should call writeFn with the mesaage prefixed with [LOG] when log", () => {
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", writeSpy);
      const message = "message";

      logger.log(message);

      expect(writeSpy.mock.lastCall).toContain(`[LOG] ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [WARN] when warn", () => {
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", writeSpy);
      const message = "message";

      logger.warn(message);

      expect(writeSpy.mock.lastCall).toContain(`[WARN] ${message}\n`);
    });

    it("should call writeFn with the mesaage prefixed with [ERROR] when error", () => {
      const writeSpy = vi.fn();
      const logger = new FileLogger("./src/test/outputs", writeSpy);
      const message = "message";

      logger.error(message);

      expect(writeSpy.mock.lastCall).toContain(`[ERROR] ${message}\n`);
    });

    it("should create the log file if it does not exist", () => {
      const logger = new FileLogger("./src/test/outputs");
      logger.log("this is the message");
    });
  });
});
