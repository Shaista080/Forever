# Cypress E2E Structure

```
cypress/
  e2e/            spec files (*.cy.ts) — one per user flow
  pages/          locator constants + helper fns, one file per page/section
  types/          shared TS interfaces, one file per domain (user, product, checkout)
  fixtures/       static JSON test data
  support/
    commands/     plain exported helper functions, split by domain (auth.ts, product.ts)
    e2e.ts        support file loaded before every spec
  tasks/          node-side cy.task implementations (e.g. seedData.cjs)
```
