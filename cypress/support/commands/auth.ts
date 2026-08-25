import { RegisterUserPayload, RegisterUserResponse } from '../../types'

export function registerUserViaApi(user: RegisterUserPayload) {
  return cy.request<RegisterUserResponse>(
    'POST',
    `${Cypress.env('apiUrl')}/api/user/register`,
    user
  )
}
