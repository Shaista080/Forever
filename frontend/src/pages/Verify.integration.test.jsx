import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import Verify from './Verify'
import ShopContextProvider from '../context/ShopContext'

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid='location'>{loc.pathname}</div>
}

const OrdersStub = () => <div data-testid='orders-page'>Orders</div>
const CartStub = () => <div data-testid='cart-page'>Cart</div>

const renderVerify = (query) =>
  render(
    <MemoryRouter initialEntries={[`/verify${query}`]}>
      <ShopContextProvider>
        <Routes>
          <Route path='/verify' element={<Verify />} />
          <Route path='/orders' element={<OrdersStub />} />
          <Route path='/cart' element={<CartStub />} />
        </Routes>
        <LocationProbe />
      </ShopContextProvider>
    </MemoryRouter>
  )

describe('Verify Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    axios.get.mockResolvedValue({ data: { success: true, products: [] } })
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/api/cart/get')) {
        return Promise.resolve({ data: { success: true, cartData: {} } })
      }
      return Promise.resolve({ data: { success: true } })
    })
  })

  afterEach(() => localStorage.clear())

  it('verifies payment and navigates to /orders on success via real ShopContext', async () => {
    localStorage.setItem('token', 'stored-token')

    renderVerify('?success=true&orderId=order-1')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/orders')
    })

    const call = axios.post.mock.calls.find(([u]) =>
      u.endsWith('/api/order/verifystripe')
    )
    expect(call[1]).toEqual({ success: 'true', orderId: 'order-1' })
    expect(call[2]).toEqual({
      headers: { Authorization: 'Bearer stored-token' },
    })
  })

  it('navigates to /cart when verification fails', async () => {
    localStorage.setItem('token', 'stored-token')
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/api/cart/get')) {
        return Promise.resolve({ data: { success: true, cartData: {} } })
      }
      return Promise.resolve({ data: { success: false } })
    })

    renderVerify('?success=false&orderId=order-1')

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/cart')
    })
  })
})
