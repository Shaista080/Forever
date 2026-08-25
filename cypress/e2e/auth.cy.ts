import { faker } from '@faker-js/faker'
import * as loginPage from '../pages/login'
import * as navbar from '../pages/navbar'
import { registerUserViaApi } from '../support/commands/auth'

describe('Signup and login', () => {
  it('User is able to create a new account', () => {
    const name = faker.person.fullName()
    const email = faker.internet.email()

    cy.visit('/login')

    //switch to signup
    cy.get(loginPage.TOGGLE_LINK).click()

    cy.get(loginPage.NAME_INPUT).type(name)
    cy.get(loginPage.EMAIL_INPUT).type(email)
    cy.get(loginPage.PASSWORD_INPUT).type(loginPage.testPassword)
    cy.get(loginPage.CONFIRM_PASSWORD_INPUT).type(loginPage.testPassword)

    cy.get(loginPage.SUBMIT_BUTTON).click()

    cy.url().should('eq', `${Cypress.config().baseUrl}/`)
    cy.window().its('localStorage.token').should('exist')
    cy.get(navbar.PROFILE_ICON).should('be.visible')
  })

  context('Login', () => {
    let email: string

    beforeEach(() => {
      email = faker.internet.email()

      registerUserViaApi({
        name: faker.person.fullName(),
        email,
        password: loginPage.testPassword,
      }).then((response) => {
        expect(response.body.success, response.body.message).to.be.true
      })
    })

    it('user is able to log in and stay logged in after a page reload', () => {
      cy.visit('/login')

      cy.get(loginPage.EMAIL_INPUT).type(email)
      cy.get(loginPage.PASSWORD_INPUT).type(loginPage.testPassword)
      cy.get(loginPage.SUBMIT_BUTTON).click()

      cy.url().should('eq', `${Cypress.config().baseUrl}/`)
      cy.window().its('localStorage.token').should('exist')

      cy.visit('/cart')
      cy.reload()

      cy.window().its('localStorage.token').should('exist')
      cy.get(navbar.PROFILE_ICON).should('be.visible')
    })
  })
})
