import { RegisterUserPayload } from '../types'

Cypress.Commands.add('registerUserViaApi', (user: RegisterUserPayload) => {
  return cy.request('POST', `${Cypress.env('apiUrl')}/api/user/register`, user)
})
