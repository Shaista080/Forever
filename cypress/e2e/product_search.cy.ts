import { SeedProductCounts } from '../types'
import * as collectionPage from '../pages/collection'
import * as navbar from '../pages/navbar'
import * as searchbar from '../pages/searchbar'
import { getSeedProductCounts } from '../support/commands/product'

const productOneName = 'E2E Guest Cart Item One'

describe('User Searching the Store', () => {
  let counts: SeedProductCounts

  before(() => {
    getSeedProductCounts().then((seedCounts) => {
      counts = seedCounts
    })
  })

  it('User can search for products by name', () => {
    cy.visit('/collection')

    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.all
    )

    cy.get(navbar.SEARCH_ICON).click()
    cy.get(searchbar.SEARCH_INPUT).type(productOneName)

    cy.get(collectionPage.PRODUCT_CARD).should('have.length', 1)
    cy.get(collectionPage.productCardByName(productOneName)).should(
      'be.visible'
    )
  })

  it('User can clear the search to see all products again', () => {
    cy.visit('/collection')

    cy.get(navbar.SEARCH_ICON).click()
    cy.get(searchbar.SEARCH_INPUT).type(productOneName)
    cy.get(collectionPage.PRODUCT_CARD).should('have.length', 1)

    cy.get(searchbar.CLEAR_ICON).click()

    cy.get(searchbar.SEARCH_INPUT).should('not.exist')
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.all
    )
  })

  it('User sees no results for a search term matching no product', () => {
    cy.visit('/collection')

    cy.get(navbar.SEARCH_ICON).click()
    cy.get(searchbar.SEARCH_INPUT).type('no product has this name in it')

    cy.get(collectionPage.PRODUCT_CARD).should('have.length', 0)
  })

  it('Search field is not shown outside the collection page', () => {
    cy.visit('/')

    cy.get(navbar.SEARCH_ICON).click()
    cy.get(searchbar.SEARCH_INPUT).should('not.exist')
  })
})
