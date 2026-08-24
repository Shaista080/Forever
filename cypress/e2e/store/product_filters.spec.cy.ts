import { SeedProductCounts } from '../../types'

describe('Guest User Exploring the Store', () => {
  let counts: SeedProductCounts

  before(() => {
    cy.getSeedProductCounts().then((seedCounts) => {
      counts = seedCounts
    })
  })

  it('Guest user can filter products by category', () => {
    cy.visit('/collection')

    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.category.all
    )

    cy.get('[data-testid="filter-category-men"]').check({ force: true })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.category.Men
    )
    cy.get('[data-testid="filter-category-men"]').uncheck({ force: true })

    cy.get('[data-testid="filter-category-women"]').check({ force: true })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.category.Women
    )
    cy.get('[data-testid="filter-category-women"]').uncheck({ force: true })

    cy.get('[data-testid="filter-category-kids"]').check({ force: true })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.category.Kids
    )
    cy.get('[data-testid="filter-category-kids"]').uncheck({ force: true })

    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.category.all
    )
  })

  it('Guest user can filter products based on type', () => {
    cy.visit('/collection')

    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.type.all
    )

    cy.get('[data-testid="filter-subcategory-topwear"]').check({
      force: true,
    })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.type.Topwear
    )
    cy.get('[data-testid="filter-subcategory-topwear"]').uncheck({
      force: true,
    })

    cy.get('[data-testid="filter-subcategory-bottomwear"]').check({
      force: true,
    })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.type.Bottomwear
    )
    cy.get('[data-testid="filter-subcategory-bottomwear"]').uncheck({
      force: true,
    })

    cy.get('[data-testid="filter-subcategory-winterwear"]').check({
      force: true,
    })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.type.Winterwear
    )
    cy.get('[data-testid="filter-subcategory-winterwear"]').uncheck({
      force: true,
    })

    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.type.all
    )
  })

  it('guest user can filter products by both category and type', () => {
    cy.visit('/collection')

    cy.get('[data-testid="filter-category-men"]').check({ force: true })
    cy.get('[data-testid="filter-subcategory-bottomwear"]').check({
      force: true,
    })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.combo.MenBottomwear
    )
    cy.get('[data-testid="filter-category-men"]').uncheck({ force: true })
    cy.get('[data-testid="filter-subcategory-bottomwear"]').uncheck({
      force: true,
    })

    cy.get('[data-testid="filter-category-women"]').check({ force: true })
    cy.get('[data-testid="filter-subcategory-winterwear"]').check({
      force: true,
    })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.combo.WomenWinterwear
    )
    cy.get('[data-testid="filter-category-women"]').uncheck({ force: true })
    cy.get('[data-testid="filter-subcategory-winterwear"]').uncheck({
      force: true,
    })

    cy.get('[data-testid="filter-category-women"]').check({ force: true })
    cy.get('[data-testid="filter-category-kids"]').check({ force: true })
    cy.get('[data-testid="filter-subcategory-topwear"]').check({
      force: true,
    })
    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.combo.WomenKidsTopwear
    )
    cy.get('[data-testid="filter-category-women"]').uncheck({ force: true })
    cy.get('[data-testid="filter-category-kids"]').uncheck({ force: true })
    cy.get('[data-testid="filter-subcategory-topwear"]').uncheck({
      force: true,
    })

    cy.get('[data-testid="product-card"]').should(
      'have.length',
      counts.category.all
    )
  })
})
