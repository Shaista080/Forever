import { RegisterUserPayload, SeedProduct, SeedProductCounts } from '../types'

Cypress.Commands.add('registerUserViaApi', (user: RegisterUserPayload) => {
  return cy.request('POST', `${Cypress.env('apiUrl')}/api/user/register`, user)
})

Cypress.Commands.add('getSeedProductCounts', () => {
  return cy.task<SeedProductCounts>('getSeedProductCounts')
})

Cypress.Commands.add('getSeedProduct', (name: string) => {
  return cy.task<SeedProduct>('getSeedProductByName', name)
})
