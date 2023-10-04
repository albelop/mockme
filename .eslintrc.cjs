module.exports = {
  extends: ['eslint-config-airbnb-base', 'eslint-config-prettier'],
  globals: {
    globalThis: false,
  },
  env: {
    node: true,
    browser: false,
  },
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'import/extensions': ['error', 'always', { ignorePackages: true }],
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/test/**/*.{html,js,mjs,ts}',
          '**/stories/**/*.{html,js,mjs,ts}',
          '**/demo/**/*.{html,js,mjs,ts}',
          '**/*.config.{html,js,mjs,ts}',
          '**/*.conf.{html,js,mjs,ts}',
        ],
      },
    ],
    'class-methods-use-this': [
      'error',
      {
        exceptMethods: [
          // web components life cycle
          'connectedCallback',
          'disconnectedCallback',

          // LitElement life cycle
          'performUpdate',
          'shouldUpdate',
          'firstUpdated',
          'update',
          'updated',
          'createRenderRoot',
          'render',
        ],
      },
    ],
  },
  overrides: [
    {
      files: [
        '**/test/**/*.{html,js,mjs,ts}',
      ],
      rules: {
        'no-console': 'off',
        'no-unused-expressions': 'off',
        'class-methods-use-this': 'off',
      },
    },
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    requireConfigFile: false,
  }
};
