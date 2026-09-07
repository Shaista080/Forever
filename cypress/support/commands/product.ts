import { SeedProduct, SeedProductCounts } from '../../types'
import * as collectionPage from '../../pages/collection'
import * as productPage from '../../pages/product'

export function getSeedProductCounts() {
  return cy.task<SeedProductCounts>('getSeedProductCounts')
}

export function getSeedProduct(name: string) {
  return cy.task<SeedProduct>('getSeedProductByName', name)
}

// Assumes the collection grid is already visible on the page.
export function addProductToCartByName(name: string, size: string) {
  cy.get(collectionPage.productCardByName(name)).click()
  cy.get(productPage.productSizeByLabel(size)).click()
  cy.get(productPage.ADD_TO_CART_BUTTON).click()
}
