import { RegisterUserPayload, RegisterUserResponse } from './index'

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
    }
  }
}
