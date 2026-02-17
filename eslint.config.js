import globals from 'globals'
import pluginJs from '@eslint/js'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  pluginJs.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    rules: {},
  },
]
