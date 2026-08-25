import { SeedProductCounts } from '../types'
import * as collectionPage from '../pages/collection'
import { getSeedProductCounts } from '../support/commands/product'

describe('Guest User Exploring the Store', () => {
  let counts: SeedProductCounts

  before(() => {
    getSeedProductCounts().then((seedCounts) => {
      counts = seedCounts
    })
  })

  it('Guest user can filter products by category', () => {
    cy.visit('/collection')

    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.all
    )

    cy.get(collectionPage.FILTER_CATEGORY_MEN).check({ force: true })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.Men
    )
    cy.get(collectionPage.FILTER_CATEGORY_MEN).uncheck({ force: true })

    cy.get(collectionPage.FILTER_CATEGORY_WOMEN).check({ force: true })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.Women
    )
    cy.get(collectionPage.FILTER_CATEGORY_WOMEN).uncheck({ force: true })

    cy.get(collectionPage.FILTER_CATEGORY_KIDS).check({ force: true })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.Kids
    )
    cy.get(collectionPage.FILTER_CATEGORY_KIDS).uncheck({ force: true })

    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.all
    )
  })

  it('Guest user can filter products based on type', () => {
    cy.visit('/collection')

    cy.get(collectionPage.PRODUCT_CARD).should('have.length', counts.type.all)

    cy.get(collectionPage.FILTER_SUBCATEGORY_TOPWEAR).check({ force: true })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.type.Topwear
    )
    cy.get(collectionPage.FILTER_SUBCATEGORY_TOPWEAR).uncheck({ force: true })

    cy.get(collectionPage.FILTER_SUBCATEGORY_BOTTOMWEAR).check({
      force: true,
    })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.type.Bottomwear
    )
    cy.get(collectionPage.FILTER_SUBCATEGORY_BOTTOMWEAR).uncheck({
      force: true,
    })

    cy.get(collectionPage.FILTER_SUBCATEGORY_WINTERWEAR).check({
      force: true,
    })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.type.Winterwear
    )
    cy.get(collectionPage.FILTER_SUBCATEGORY_WINTERWEAR).uncheck({
      force: true,
    })

    cy.get(collectionPage.PRODUCT_CARD).should('have.length', counts.type.all)
  })

  it('guest user can filter products by both category and type', () => {
    cy.visit('/collection')

    cy.get(collectionPage.FILTER_CATEGORY_MEN).check({ force: true })
    cy.get(collectionPage.FILTER_SUBCATEGORY_BOTTOMWEAR).check({
      force: true,
    })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.combo.MenBottomwear
    )
    cy.get(collectionPage.FILTER_CATEGORY_MEN).uncheck({ force: true })
    cy.get(collectionPage.FILTER_SUBCATEGORY_BOTTOMWEAR).uncheck({
      force: true,
    })

    cy.get(collectionPage.FILTER_CATEGORY_WOMEN).check({ force: true })
    cy.get(collectionPage.FILTER_SUBCATEGORY_WINTERWEAR).check({
      force: true,
    })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.combo.WomenWinterwear
    )
    cy.get(collectionPage.FILTER_CATEGORY_WOMEN).uncheck({ force: true })
    cy.get(collectionPage.FILTER_SUBCATEGORY_WINTERWEAR).uncheck({
      force: true,
    })

    cy.get(collectionPage.FILTER_CATEGORY_WOMEN).check({ force: true })
    cy.get(collectionPage.FILTER_CATEGORY_KIDS).check({ force: true })
    cy.get(collectionPage.FILTER_SUBCATEGORY_TOPWEAR).check({ force: true })
    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.combo.WomenKidsTopwear
    )
    cy.get(collectionPage.FILTER_CATEGORY_WOMEN).uncheck({ force: true })
    cy.get(collectionPage.FILTER_CATEGORY_KIDS).uncheck({ force: true })
    cy.get(collectionPage.FILTER_SUBCATEGORY_TOPWEAR).uncheck({ force: true })

    cy.get(collectionPage.PRODUCT_CARD).should(
      'have.length',
      counts.category.all
    )
  })
})
