import * as checkoutPage from '../../pages/checkout'
import { GuestAddress } from '../../types'

export function fillDeliveryAddress(address: GuestAddress) {
  cy.get(checkoutPage.FIRST_NAME_INPUT).type(address.firstName)
  cy.get(checkoutPage.LAST_NAME_INPUT).type(address.lastName)
  cy.get(checkoutPage.EMAIL_INPUT).type(address.email)
  cy.get(checkoutPage.STREET_INPUT).type(address.street)
  cy.get(checkoutPage.CITY_INPUT).type(address.city)
  cy.get(checkoutPage.STATE_INPUT).type(address.state)
  cy.get(checkoutPage.ZIPCODE_INPUT).type(address.zipcode)
  cy.get(checkoutPage.COUNTRY_INPUT).type(address.country)
  cy.get(checkoutPage.PHONE_INPUT).type(address.phone)
}
