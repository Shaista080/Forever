import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import PlaceOrder from './PlaceOrder'
import Cart from './Cart'
import ShopContextProvider from '../context/ShopContext'

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid='location'>{loc.pathname}</div>
}

const products = [{ _id: 'p1', name: 'Blue Shirt', price: 100, image: ['b.png'] }]

// Full PlaceOrder page through the real ShopContext + router. Cart seeded via
// the on-mount getUserCart fetch; only the network boundary (axios) is mocked.
const renderPlaceOrder = (cartData = { p1: { M: 2 } }) => {
  localStorage.setItem('token', 'tok')
  axios.get = vi.fn().mockResolvedValue({ data: { success: true, products } })
  axios.post = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/cart/get')) {
      return Promise.resolve({ data: { success: true, cartData } })
    }
    // /api/order/place
    return Promise.resolve({ data: { success: true } })
  })

  return render(
    <MemoryRouter initialEntries={['/place-order']}>
      <ShopContextProvider>
        <Routes>
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/orders' element={<div data-testid='orders'>Orders</div>} />
          <Route path='/cart' element={<Cart />} />
        </Routes>
        <LocationProbe />
      </ShopContextProvider>
    </MemoryRouter>
  )
}

const fillRequired = (container) => {
  const values = {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'a@b.com',
    street: '1 Main',
    city: 'NYC',
    state: 'NY',
    zipcode: '10001',
    country: 'USA',
    phone: '5551234',
  }
  for (const [name, value] of Object.entries(values)) {
    fireEvent.change(container.querySelector(`[name="${name}"]`), {
      target: { name, value },
    })
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('PlaceOrder Page (integration)', () => {
  it('places a COD order using the real cart, posts the computed amount, then clears the cart and navigates to /orders', async () => {
    const { container } = renderPlaceOrder({ p1: { M: 2 } })

    // Wait for products + cart to load so the amount is computed from real state.
    await waitFor(() => expect(axios.get).toHaveBeenCalled())
    fillRequired(container)

    fireEvent.submit(container.querySelector('form'))

    await waitFor(() =>
      expect(screen.getByTestId('orders')).toBeInTheDocument()
    )

    // Assert the order POST carried the amount derived from real getCartAmount.
    const orderCall = axios.post.mock.calls.find((c) =>
      c[0].includes('/api/order/place')
    )
    expect(orderCall).toBeDefined()
    expect(orderCall[1].amount).toBe(210) // 2 * 100 + 10 delivery
    expect(orderCall[1].items).toHaveLength(1)
    expect(orderCall[2].headers.Authorization).toBe('Bearer tok')

    expect(screen.getByTestId('location').textContent).toBe('/orders')
  })
})
