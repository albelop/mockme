import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageJson = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../package.json'), {
    encoding: 'utf8',
  }),
);

export const { version } = packageJson;
export const { description } = packageJson;
export default packageJson;
