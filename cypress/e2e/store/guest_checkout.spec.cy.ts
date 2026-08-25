const PRODUCT_ONE = 'E2E Guest Cart Item One'
const PRODUCT_TWO = 'E2E Guest Cart Item Two'
const DELIVERY_FEE = 10

describe('Guest user checkout flow', () => {
  it('Guest user is able to add items to cart', () => {
    let productOnePrice: number
    let productTwoPrice: number

    cy.getSeedProduct(PRODUCT_ONE).then((p) => {
      productOnePrice = p.price
    })
    cy.getSeedProduct(PRODUCT_TWO).then((p) => {
      productTwoPrice = p.price
    })

    cy.visit('/collection')

    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0)

    // first product, size S
    cy.get(
      `[data-testid="product-card"][data-product-name="${PRODUCT_ONE}"]`
    ).click()
    cy.get('[data-testid="product-size-S"]').click()
    cy.get('[data-testid="add-to-cart-button"]').click()

    cy.get('[data-testid="navbar-cart-count"]').should('have.text', '1')

    // second product, size L — navigate via the nav link (client-side route
    // change) instead of cy.visit, which would do a full reload and wipe the
    // guest cart (cartItems only lives in React state, never persisted - code related issue)
    cy.get('[data-testid="navbar-collection-link"]').click()
    cy.get(
      `[data-testid="product-card"][data-product-name="${PRODUCT_TWO}"]`
    ).click()
    cy.get('[data-testid="product-size-L"]').click()
    cy.get('[data-testid="add-to-cart-button"]').click()

    cy.get('[data-testid="navbar-cart-count"]').should('have.text', '2')

    // navbar link, not cy.visit — same full-reload/cart-wipe reason as above
    cy.get('[data-testid="navbar-cart-link"]').click()

    cy.get('[data-testid="cart-item"]').should('have.length', 2)

    // bump the first product's quantity from 1 to 2 in cart
    cy.get('[data-testid="cart-item"]')
      .contains('[data-testid="cart-item-name"]', PRODUCT_ONE)
      .parents('[data-testid="cart-item"]')
      .find('[data-testid="cart-item-quantity"]')
      .clear()
      .type('2')

    cy.get('[data-testid="navbar-cart-count"]').should('have.text', '3')

    // verify final cart contents: product/size/quantity/price per row
    cy.get('[data-testid="cart-item"]')
      .contains('[data-testid="cart-item-name"]', PRODUCT_ONE)
      .parents('[data-testid="cart-item"]')
      .within(() => {
        cy.get('[data-testid="cart-item-size"]').should('have.text', 'S')
        cy.get('[data-testid="cart-item-quantity"]').should('have.value', '2')
        cy.get('[data-testid="cart-item-price"]').then(($price) => {
          expect($price.text()).to.contain(String(productOnePrice))
        })
      })

    cy.get('[data-testid="cart-item"]')
      .contains('[data-testid="cart-item-name"]', PRODUCT_TWO)
      .parents('[data-testid="cart-item"]')
      .within(() => {
        cy.get('[data-testid="cart-item-size"]').should('have.text', 'L')
        cy.get('[data-testid="cart-item-quantity"]').should('have.value', '1')
        cy.get('[data-testid="cart-item-price"]').then(($price) => {
          expect($price.text()).to.contain(String(productTwoPrice))
        })
      })

    // subtotal/total: product one qty 2 + product two qty 1
    cy.then(() => {
      const expectedSubtotal = productOnePrice * 2 + productTwoPrice * 1
      const expectedTotal = expectedSubtotal + DELIVERY_FEE

      cy.get('[data-testid="cart-subtotal"]').should(
        'have.text',
        `$ ${expectedSubtotal}.00`
      )
      cy.get('[data-testid="cart-total"]').should(
        'have.text',
        `$ ${expectedTotal}.00`
      )
    })
  })

  it('Guest user is blocked from completing checkout', () => {
    cy.visit('/collection')
    cy.get('[data-testid="product-card"]').first().click()
    cy.get('[data-testid^="product-size-"]').first().click()
    cy.get('[data-testid="add-to-cart-button"]').click()

    cy.visit('/cart')
    cy.get('[data-testid="proceed-to-checkout-button"]').click()

    cy.url().should('include', '/place-order')

    cy.intercept('POST', '**/api/order/place').as('placeOrder')

    cy.get('input[name="firstName"]').type('Guest')
    cy.get('input[name="lastName"]').type('User')
    cy.get('input[name="email"]').type('guest@example.com')
    cy.get('input[name="street"]').type('123 Main St')
    cy.get('input[name="city"]').type('Metropolis')
    cy.get('input[name="state"]').type('NY')
    cy.get('input[name="zipcode"]').type('10001')
    cy.get('input[name="country"]').type('USA')
    cy.get('input[name="phone"]').type('5551234567')

    cy.get('button[type="submit"]').click()

    cy.wait('@placeOrder').its('response.statusCode').should('eq', 401)

    // guest is not redirected to the orders page — order was rejected
    cy.url().should('include', '/place-order')
  })
})
