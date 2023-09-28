import FileLogger from "./loggers/FileLogger.js";

export function useLogger(outdir, Logger = FileLogger) {
  // @ts-ignore
  if (outdir) {
    // @ts-ignore
    return new Logger(outdir);
  } else {
    return console;
  }
}
