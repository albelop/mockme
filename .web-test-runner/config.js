import { defaultReporter } from '@web/test-runner';
import { playwrightLauncher } from '@web/test-runner-playwright';
import { testRunnerHtml } from './testRunnerHtml.js';
import { when, arg } from './utils.js';

const shouldRunInFirefox = arg('firefox');
const shouldRunInWebKit = arg('webkit');
const shouldRunInChromium = arg('chromium') || !(shouldRunInFirefox || shouldRunInWebKit);

export default {
  nodeResolve: true,
  coverageConfig: {
    report: true,
    reportDir: 'coverage',
    threshold: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
    exclude: ['node_modules/**/*', 'src/cli/**/*', 'src/loggers/**/*', '.*/**/*'],
  },
  testFramework: {
    config: {
      timeout: '10000',
    },
  },
  files: ['src/manager/**/*.test.js', 'src/manager/**/*.test.js', 'src/sw/**/*.test.{js,html}'],
  browsers: [
    ...when(shouldRunInChromium, () => [playwrightLauncher({ product: 'chromium' })]),
    ...when(shouldRunInFirefox, () => [playwrightLauncher({ product: 'firefox' })]),
    ...when(shouldRunInWebKit, () => [playwrightLauncher({ product: 'webkit' })]),
  ],
  reporters: [
    // use the default reporter only for reporting test progress
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
  ],
  testRunnerHtml,
};
