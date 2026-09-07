import { faker } from '@faker-js/faker'
import * as loginPage from '../pages/login'
import * as collectionPage from '../pages/collection'
import * as cartPage from '../pages/cart'
import * as checkoutPage from '../pages/checkout'
import * as ordersPage from '../pages/orders'
import * as navbar from '../pages/navbar'
import { GuestAddress } from '../types'
import {
  registerUserViaApi,
  visitAsLoggedInUser,
} from '../support/commands/auth'
import { addProductToCartByName } from '../support/commands/product'
import { fillDeliveryAddress } from '../support/commands/checkout'

const productOneName = 'E2E Guest Cart Item One'
const productTwoName = 'E2E Guest Cart Item Two'

describe('Logged-in user checkout flow', () => {
  let token: string

  beforeEach(() => {
    registerUserViaApi({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: loginPage.testPassword,
    }).then((response) => {
      expect(response.body.success, response.body.message).to.be.true
      token = response.body.token as string
    })
  })

  it('Logged-in user is able to add items to cart', () => {
    visitAsLoggedInUser('/collection', token)

    cy.get(collectionPage.PRODUCT_CARD).should('have.length.greaterThan', 0)

    // first product, size S
    addProductToCartByName(productOneName, 'S')

    cy.get(navbar.CART_COUNT).should('have.text', '1')

    // second product, size L — via a full page visit, to prove a logged-in
    // cart is synced from the backend and survives a reload (unlike guest)
    cy.visit('/collection')
    addProductToCartByName(productTwoName, 'L')

    cy.get(navbar.CART_COUNT).should('have.text', '2')

    cy.visit('/cart')

    cy.get(cartPage.CART_ITEM).should('have.length', 2)

    cy.get(cartPage.CART_ITEM)
      .contains(cartPage.CART_ITEM_NAME, productOneName)
      .parents(cartPage.CART_ITEM)
      .find(cartPage.CART_ITEM_SIZE)
      .should('have.text', 'S')

    cy.get(cartPage.CART_ITEM)
      .contains(cartPage.CART_ITEM_NAME, productTwoName)
      .parents(cartPage.CART_ITEM)
      .find(cartPage.CART_ITEM_SIZE)
      .should('have.text', 'L')
  })

  it('Logged-in user is able to remove an item from cart', () => {
    visitAsLoggedInUser('/collection', token)

    addProductToCartByName(productOneName, 'S')
    cy.get(navbar.CART_COUNT).should('have.text', '1')

    cy.visit('/collection')
    addProductToCartByName(productTwoName, 'L')
    cy.get(navbar.CART_COUNT).should('have.text', '2')

    cy.visit('/cart')
    cy.get(cartPage.CART_ITEM).should('have.length', 2)

    cy.get(cartPage.CART_ITEM)
      .contains(cartPage.CART_ITEM_NAME, productOneName)
      .parents(cartPage.CART_ITEM)
      .find(cartPage.CART_ITEM_REMOVE)
      .click()

    cy.get(navbar.CART_COUNT).should('have.text', '1')
    cy.get(cartPage.CART_ITEM).should('have.length', 1)
    cy.get(cartPage.CART_ITEM_NAME).should('have.text', productTwoName)
  })

  it('Logged-in user is able to complete purchase', () => {
    visitAsLoggedInUser('/collection', token)
    addProductToCartByName(productOneName, 'M')

    cy.get(navbar.CART_COUNT).should('have.text', '1')

    cy.visit('/cart')
    cy.get(cartPage.PROCEED_TO_CHECKOUT_BUTTON).click()

    cy.url().should('include', '/place-order')

    cy.intercept('POST', '**/api/order/place').as('placeOrder')

    cy.fixture<GuestAddress>('guestAddress').then(fillDeliveryAddress)

    cy.get(checkoutPage.COD_PAYMENT_OPTION).click()
    cy.get(checkoutPage.PLACE_ORDER_BUTTON).click()

    cy.wait('@placeOrder').its('response.statusCode').should('eq', 200)

    cy.url().should('include', '/orders')

    cy.get(ordersPage.orderItemByName(productOneName)).within(() => {
      cy.get(ordersPage.ORDER_ITEM_QUANTITY).should('have.text', 'Quantity: 1')
      cy.get(ordersPage.ORDER_ITEM_SIZE).should('have.text', 'Size: M')
      cy.get(ordersPage.ORDER_ITEM_PAYMENT_METHOD).should('have.text', 'COD')
      cy.get(ordersPage.ORDER_ITEM_STATUS).should('have.text', 'Order Placed')
    })

    // cart is cleared after a successful order
    cy.get(navbar.CART_COUNT).should('have.text', '0')
  })
})
