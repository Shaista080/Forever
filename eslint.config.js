import globals from 'globals'
import pluginJs from '@eslint/js'

export default [
  { ignores: ['node_modules'] }, // Added global ignore for node_modules
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
  pluginJs.configs.recommended,
]
