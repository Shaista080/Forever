import {
  RegisterUserPayload,
  RegisterUserResponse,
  SeedProduct,
  SeedProductCounts,
} from './index'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Registers a user directly via the backend API (no UI interaction).
       * Use for test setup when registration itself isn't the behavior under test.
       */
      registerUserViaApi(
        user: RegisterUserPayload
      ): Chainable<Cypress.Response<RegisterUserResponse>>

      /**
       * Reads backend/scripts/seed-data.json (via a Node task) and returns
       * live category/type/combo product counts — stays correct if seed data changes.
       */
      getSeedProductCounts(): Chainable<SeedProductCounts>

      /**
       * Reads a single product's data (incl. price) from
       * backend/scripts/seed-data.json by exact name, via a Node task.
       */
      getSeedProduct(name: string): Chainable<SeedProduct>
    }
  }
}
