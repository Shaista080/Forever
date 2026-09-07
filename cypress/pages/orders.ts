export const ORDER_ITEM = '[data-testid="order-item"]'
export const ORDER_ITEM_NAME = '[data-testid="order-item-name"]'
export const ORDER_ITEM_QUANTITY = '[data-testid="order-item-quantity"]'
export const ORDER_ITEM_SIZE = '[data-testid="order-item-size"]'
export const ORDER_ITEM_PAYMENT_METHOD =
  '[data-testid="order-item-payment-method"]'
export const ORDER_ITEM_STATUS = '[data-testid="order-item-status"]'

export function orderItemByName(name: string) {
  return `${ORDER_ITEM}[data-order-item-name="${name}"]`
}
