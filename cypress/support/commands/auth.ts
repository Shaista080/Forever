import { RegisterUserPayload, RegisterUserResponse } from '../../types'

export function registerUserViaApi(user: RegisterUserPayload) {
  return cy.request<RegisterUserResponse>(
    'POST',
    `${Cypress.env('apiUrl')}/api/user/register`,
    user
  )
}

// Seeds the auth token into localStorage before the app boots, so ShopContext
// picks it up on mount and the user lands already logged in — no UI login step.
export function visitAsLoggedInUser(path: string, token: string) {
  return cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', token)
    },
  })
}
