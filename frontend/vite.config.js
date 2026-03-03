/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    globals: true, // This makes Vitest automatically import the describe, it, and expect functions into every test file
    environment: 'jsdom', // It tells Vitest to run the tests in a simulated browser environment provided by jsdom
    setupFiles: './src/setupTests.js', //This tells Vitest to run a specific file before it runs any of your tests
  },
})
