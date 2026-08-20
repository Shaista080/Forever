const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    // setupNodeEvents(on, config) {
    // implement node event listeners here
    //  },
  },
  env: {
    apiUrl: 'http://localhost:4000',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
})
