import ConsoleLogger from "./loggers/ConsoleLogger.js";
import FileLogger from "./loggers/FileLogger.js";

// @ts-ignore
export function useLogger({ outdir, prefix } = {}, Logger = FileLogger) {
  if (outdir) {
    return new Logger(outdir, prefix);
  }

  return new ConsoleLogger(prefix);
}
