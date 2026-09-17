import { faker } from '@faker-js/faker'
import * as loginPage from '../pages/login'
import * as navbar from '../pages/navbar'
import * as ordersPage from '../pages/orders'
import {
  registerUserViaApi,
  visitAsLoggedInUser,
} from '../support/commands/auth'
import { placeOrderViaApi } from '../support/commands/order'
import { GuestAddress, PlaceOrderItem } from '../types'

describe('Orders page tests', () => {
  let email: string
  let token: string
  let address: GuestAddress
  let items: PlaceOrderItem[]

  beforeEach(() => {
    email = faker.internet.email()

    registerUserViaApi({
      name: faker.person.fullName(),
      email,
      password: loginPage.testPassword,
    }).then((response) => {
      expect(response.body.success, response.body.message).to.be.true
      token = response.body.token as string
    })

    cy.fixture<GuestAddress>('guestAddress').then((fixture) => {
      address = fixture
    })
    cy.fixture<PlaceOrderItem[]>('orderItems').then((fixture) => {
      items = fixture
    })
  })

  it('Shows no order items for a user with no orders', () => {
    visitAsLoggedInUser('/orders', token)

    cy.get(ordersPage.ORDER_ITEM).should('not.exist')
  })

  it('Lists multiple orders for the logged-in user', () => {
    cy.then(() => {
      items.forEach((item) => {
        placeOrderViaApi(token, {
          items: [item],
          amount: item.price * item.quantity,
          address,
        }).then((response) => {
          expect(response.body.success, response.body.message).to.be.true
        })
      })
    })

    visitAsLoggedInUser('/orders', token)

    cy.get(ordersPage.ORDER_ITEM).should('have.length', items.length)

    cy.then(() => {
      items.forEach((item) => {
        cy.get(ordersPage.orderItemByName(item.name)).within(() => {
          cy.get(ordersPage.ORDER_ITEM_QUANTITY).should(
            'have.text',
            `Quantity: ${item.quantity}`
          )
          cy.get(ordersPage.ORDER_ITEM_SIZE).should(
            'have.text',
            `Size: ${item.size}`
          )
          cy.get(ordersPage.ORDER_ITEM_PAYMENT_METHOD).should(
            'have.text',
            'COD'
          )
          cy.get(ordersPage.ORDER_ITEM_STATUS).should(
            'have.text',
            'Order Placed'
          )
        })
      })
    })
  })

  it('Keeps order history visible across a logout and login', () => {
    cy.then(() => {
      const item = items[0]
      placeOrderViaApi(token, {
        items: [item],
        amount: item.price * item.quantity,
        address,
      }).then((response) => {
        expect(response.body.success, response.body.message).to.be.true
      })
    })

    visitAsLoggedInUser('/orders', token)
    cy.get(ordersPage.ORDER_ITEM).should('have.length', 1)

    cy.get(navbar.PROFILE_ICON).trigger('mouseover')
    cy.get(navbar.LOGOUT_BUTTON).click({ force: true })
    cy.window().its('localStorage.token').should('not.exist')

    cy.visit('/login')
    cy.get(loginPage.EMAIL_INPUT).type(email)
    cy.get(loginPage.PASSWORD_INPUT).type(loginPage.testPassword)
    cy.get(loginPage.SUBMIT_BUTTON).click()

    cy.window().its('localStorage.token').should('exist')

    cy.visit('/orders')
    cy.get(ordersPage.orderItemByName(items[0].name)).should('exist')
  })
})
