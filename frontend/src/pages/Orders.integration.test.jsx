import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Orders from './Orders'
import ShopContextProvider from '../context/ShopContext'

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const order = {
  status: 'Order Placed',
  payment: false,
  paymentMethod: 'COD',
  date: 1700000000000,
  items: [
    {
      name: 'Integration Shirt',
      price: 100,
      quantity: 2,
      size: 'L',
      image: ['s.png'],
    },
  ],
}

const renderOrders = () =>
  render(
    <MemoryRouter initialEntries={['/orders']}>
      <ShopContextProvider>
        <Routes>
          <Route path='/orders' element={<Orders />} />
        </Routes>
      </ShopContextProvider>
    </MemoryRouter>
  )

describe('Orders Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // provider on-mount calls: product list (get) + cart get (post)
    axios.get.mockResolvedValue({ data: { success: true, products: [] } })
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/api/cart/get')) {
        return Promise.resolve({ data: { success: true, cartData: {} } })
      }
      if (url.endsWith('/api/order/userorders')) {
        return Promise.resolve({ data: { success: true, orders: [order] } })
      }
      return Promise.resolve({ data: { success: true } })
    })
  })

  afterEach(() => localStorage.clear())

  it('loads the token from storage and renders the user orders via real ShopContext', async () => {
    localStorage.setItem('token', 'stored-token')

    renderOrders()

    // order row rendered from the real provider → Orders wiring
    expect(await screen.findByText('Integration Shirt')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument()

    // userorders was called with the token pulled from localStorage
    await waitFor(() => {
      const call = axios.post.mock.calls.find(([u]) =>
        u.endsWith('/api/order/userorders')
      )
      expect(call).toBeTruthy()
      expect(call[2]).toEqual({
        headers: { Authorization: 'Bearer stored-token' },
      })
    })
  })

  it('renders no order rows when there is no token', async () => {
    renderOrders()

    await waitFor(() => {
      expect(
        axios.post.mock.calls.some(([u]) => u.endsWith('/api/order/userorders'))
      ).toBe(false)
    })
    expect(screen.queryByText('Integration Shirt')).not.toBeInTheDocument()
  })
})
