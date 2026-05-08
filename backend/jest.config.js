export default {
  testEnvironment: 'node',
  testTimeout: 30000,
  coverageProvider: 'babel',
  coverageReporters: ['html', 'text', 'lcov'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!eslint.config.js',
    '!server.js',
    '!config/cloudinary.js',
    '!config/mongodb.js',
    '!**/scripts/**',
  ],
}
