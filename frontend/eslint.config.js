const globals = require('globals');

module.exports = [
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['node_modules/**', '.next/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
