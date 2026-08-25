import { SeedProduct, SeedProductCounts } from '../../types'

export function getSeedProductCounts() {
  return cy.task<SeedProductCounts>('getSeedProductCounts')
}

export function getSeedProduct(name: string) {
  return cy.task<SeedProduct>('getSeedProductByName', name)
}
