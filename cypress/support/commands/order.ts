import { PlaceOrderPayload, PlaceOrderResponse } from '../../types'

export function placeOrderViaApi(token: string, order: PlaceOrderPayload) {
  return cy.request<PlaceOrderResponse>({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/order/place`,
    headers: { Authorization: `Bearer ${token}` },
    body: order,
  })
}
