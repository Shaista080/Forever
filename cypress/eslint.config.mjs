
import rootConfig from '../eslint.config.js';
import pluginCypress from 'eslint-plugin-cypress';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
  ...rootConfig,
  {
    files: ['cypress/**/*.js', 'cypress/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.cypress,
      },
    },
    plugins: {
      cypress: pluginCypress,
    },
    rules: {
      ...pluginCypress.configs.recommended.rules,
    },
  },
  prettierConfig,
];
