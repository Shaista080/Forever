export interface PlaceOrderItem {
  name: string
  price: number
  quantity: number
  size: string
  image: string[]
}

import { GuestAddress } from './checkout.types'

export interface PlaceOrderPayload {
  items: PlaceOrderItem[]
  amount: number
  address: GuestAddress
}

export interface PlaceOrderResponse {
  success: boolean
  message?: string
}
