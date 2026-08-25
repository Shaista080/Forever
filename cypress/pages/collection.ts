export const PRODUCT_CARD = '[data-testid="product-card"]'
export const FILTER_CATEGORY_MEN = '[data-testid="filter-category-men"]'
export const FILTER_CATEGORY_WOMEN = '[data-testid="filter-category-women"]'
export const FILTER_CATEGORY_KIDS = '[data-testid="filter-category-kids"]'
export const FILTER_SUBCATEGORY_TOPWEAR =
  '[data-testid="filter-subcategory-topwear"]'
export const FILTER_SUBCATEGORY_BOTTOMWEAR =
  '[data-testid="filter-subcategory-bottomwear"]'
export const FILTER_SUBCATEGORY_WINTERWEAR =
  '[data-testid="filter-subcategory-winterwear"]'

export function productCardByName(name: string) {
  return `${PRODUCT_CARD}[data-product-name="${name}"]`
}
