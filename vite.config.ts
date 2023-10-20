import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/cli/**/*.test.js', '**/loggers/**/*.test.js'],
  },
});
