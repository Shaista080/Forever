export const ADD_TO_CART_BUTTON = '[data-testid="add-to-cart-button"]'
export const PRODUCT_SIZE_PREFIX = '[data-testid^="product-size-"]'

export function productSizeByLabel(size: string) {
  return `[data-testid="product-size-${size}"]`
}
