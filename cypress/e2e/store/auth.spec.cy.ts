import { faker } from '@faker-js/faker'

describe('Signup and login', () => {
  it('User is able to create a new account', () => {
    const name = faker.person.fullName()
    const email = faker.internet.email()
    const password = 'Test@1234'

    cy.visit('/login')

    //switch to signup
    cy.get('[data-testid="auth-toggle-link"]').click()

    cy.get('[data-testid="auth-name-input"]').type(name)
    cy.get('[data-testid="auth-email-input"]').type(email)
    cy.get('[data-testid="auth-password-input"]').type(password)
    cy.get('[data-testid="auth-confirm-password-input"]').type(password)

    cy.get('[data-testid="auth-submit-button"]').click()

    cy.url().should('eq', `${Cypress.config().baseUrl}/`)
    cy.window().its('localStorage.token').should('exist')
    cy.get('[data-testid="navbar-profile-icon"]').should('be.visible')
  })

  context('Login', () => {
    let email: string
    let password: string

    beforeEach(() => {
      email = faker.internet.email()
      password = 'Test@1234'

      cy.registerUserViaApi({
        name: faker.person.fullName(),
        email,
        password,
      }).then((response) => {
        expect(response.body.success, response.body.message).to.be.true
      })
    })

    it('user is able to log in and stay logged in after a page reload', () => {
      cy.visit('/login')

      cy.get('[data-testid="auth-email-input"]').type(email)
      cy.get('[data-testid="auth-password-input"]').type(password)
      cy.get('[data-testid="auth-submit-button"]').click()

      cy.url().should('eq', `${Cypress.config().baseUrl}/`)
      cy.window().its('localStorage.token').should('exist')

      cy.visit('/cart')
      cy.reload()

      cy.window().its('localStorage.token').should('exist')
      cy.get('[data-testid="navbar-profile-icon"]').should('be.visible')
    })
  })
})
