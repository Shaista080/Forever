const { defineConfig } = require('cypress')
const { getSeedProductCounts, getSeedProductByName } = require('./cypress/tasks/seedData.cjs')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on) {
      on('task', {
        getSeedProductCounts,
        getSeedProductByName,
      })
    },
  },
  env: {
    apiUrl: 'http://localhost:4000',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
})
