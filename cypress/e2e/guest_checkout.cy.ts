import * as collectionPage from '../pages/collection'
import * as productPage from '../pages/product'
import * as cartPage from '../pages/cart'
import * as checkoutPage from '../pages/checkout'
import * as navbar from '../pages/navbar'
import { GuestAddress } from '../types'
import { getSeedProduct } from '../support/commands/product'

const productOneName = 'E2E Guest Cart Item One'
const productTwoName = 'E2E Guest Cart Item Two'

describe('Guest user checkout flow', () => {
  it('Guest user is able to add items to cart', () => {
    let productOnePrice: number
    let productTwoPrice: number

    getSeedProduct(productOneName).then((p) => {
      productOnePrice = p.price
    })
    getSeedProduct(productTwoName).then((p) => {
      productTwoPrice = p.price
    })

    cy.visit('/collection')

    cy.get(collectionPage.PRODUCT_CARD).should('have.length.greaterThan', 0)

    // first product, size S
    cy.get(collectionPage.productCardByName(productOneName)).click()
    cy.get(productPage.productSizeByLabel('S')).click()
    cy.get(productPage.ADD_TO_CART_BUTTON).click()

    cy.get(navbar.CART_COUNT).should('have.text', '1')

    // second product, size L — navigate via the nav link (client-side route
    // change) instead of cy.visit, which would do a full reload and wipe the
    // guest cart (cartItems only lives in React state, never persisted - code related issue)
    cy.get(navbar.COLLECTION_LINK).click()
    cy.get(collectionPage.productCardByName(productTwoName)).click()
    cy.get(productPage.productSizeByLabel('L')).click()
    cy.get(productPage.ADD_TO_CART_BUTTON).click()

    cy.get(navbar.CART_COUNT).should('have.text', '2')

    // navbar link, not cy.visit — same full-reload/cart-wipe reason as above
    cy.get(navbar.CART_LINK).click()

    cy.get(cartPage.CART_ITEM).should('have.length', 2)

    // bump the first product's quantity from 1 to 2 in cart
    cy.get(cartPage.CART_ITEM)
      .contains(cartPage.CART_ITEM_NAME, productOneName)
      .parents(cartPage.CART_ITEM)
      .find(cartPage.CART_ITEM_QUANTITY)
      .clear()
      .type('2')

    cy.get(navbar.CART_COUNT).should('have.text', '3')

    // verify final cart contents: product/size/quantity/price per row
    cy.get(cartPage.CART_ITEM)
      .contains(cartPage.CART_ITEM_NAME, productOneName)
      .parents(cartPage.CART_ITEM)
      .within(() => {
        cy.get(cartPage.CART_ITEM_SIZE).should('have.text', 'S')
        cy.get(cartPage.CART_ITEM_QUANTITY).should('have.value', '2')
        cy.get(cartPage.CART_ITEM_PRICE).then(($price) => {
          expect($price.text()).to.contain(String(productOnePrice))
        })
      })

    cy.get(cartPage.CART_ITEM)
      .contains(cartPage.CART_ITEM_NAME, productTwoName)
      .parents(cartPage.CART_ITEM)
      .within(() => {
        cy.get(cartPage.CART_ITEM_SIZE).should('have.text', 'L')
        cy.get(cartPage.CART_ITEM_QUANTITY).should('have.value', '1')
        cy.get(cartPage.CART_ITEM_PRICE).then(($price) => {
          expect($price.text()).to.contain(String(productTwoPrice))
        })
      })

    // subtotal/total: product one qty 2 + product two qty 1
    cy.then(() => {
      const expectedSubtotal = productOnePrice * 2 + productTwoPrice * 1
      const expectedTotal = expectedSubtotal + cartPage.deliveryFee

      cy.get(cartPage.CART_SUBTOTAL).should(
        'have.text',
        `$ ${expectedSubtotal}.00`
      )
      cy.get(cartPage.CART_TOTAL).should('have.text', `$ ${expectedTotal}.00`)
    })
  })

  it('Guest user is blocked from completing checkout', () => {
    cy.visit('/collection')
    cy.get(collectionPage.PRODUCT_CARD).first().click()
    cy.get(productPage.PRODUCT_SIZE_PREFIX).first().click()
    cy.get(productPage.ADD_TO_CART_BUTTON).click()

    cy.visit('/cart')
    cy.get(cartPage.PROCEED_TO_CHECKOUT_BUTTON).click()

    cy.url().should('include', '/place-order')

    cy.intercept('POST', '**/api/order/place').as('placeOrder')

    cy.fixture<GuestAddress>('guestAddress').then((guestAddress) => {
      cy.get(checkoutPage.FIRST_NAME_INPUT).type(guestAddress.firstName)
      cy.get(checkoutPage.LAST_NAME_INPUT).type(guestAddress.lastName)
      cy.get(checkoutPage.EMAIL_INPUT).type(guestAddress.email)
      cy.get(checkoutPage.STREET_INPUT).type(guestAddress.street)
      cy.get(checkoutPage.CITY_INPUT).type(guestAddress.city)
      cy.get(checkoutPage.STATE_INPUT).type(guestAddress.state)
      cy.get(checkoutPage.ZIPCODE_INPUT).type(guestAddress.zipcode)
      cy.get(checkoutPage.COUNTRY_INPUT).type(guestAddress.country)
      cy.get(checkoutPage.PHONE_INPUT).type(guestAddress.phone)
    })

    cy.get(checkoutPage.SUBMIT_BUTTON).click()

    cy.wait('@placeOrder').its('response.statusCode').should('eq', 401)

    // guest is not redirected to the orders page — order was rejected
    cy.url().should('include', '/place-order')
  })
})
