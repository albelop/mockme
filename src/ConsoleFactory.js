import { createWriteStream, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import nodeConsole from 'node:console';

const getFileName = (type) => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();

  return `${year}-${month}-${day}.${type}.log`;
};

export class ConsoleFactory {
  static get(
    { outputDirectory } = {},
    {
      createDirectory = (directory) => mkdirSync(directory, { recursive: true }),
      createStream = (path) => createWriteStream(path),
    } = {},
  ) {
    if (outputDirectory) {
      createDirectory(outputDirectory);

      return new nodeConsole.Console({
        stdout: createStream(join(outputDirectory, getFileName('out'))),
        stderr: createStream(join(outputDirectory, getFileName('err'))),
      });
    }

    return nodeConsole;
  }
}
