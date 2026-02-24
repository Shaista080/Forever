import rootConfig from '../eslint.config.js'
import prettierConfig from 'eslint-config-prettier'

export default [
  ...rootConfig, // Extend the root configuration
  {
    files: ['**/*.js'], // Apply to all .js files in the backend
    rules: {
      // Add any backend-specific rules here
      // For example, you might want to disable console.log in production builds
      // 'no-console': 'warn',
    },
  },
  prettierConfig, // Disable ESLint rules that conflict with Prettier
]
