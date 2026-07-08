import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
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

const products = [
  { _id: 'p1', name: 'Blue Shirt', price: 100, image: ['blue.png'] },
  { _id: 'p2', name: 'Red Dress', price: 50, image: ['red.png'] },
]

// Renders the real Cart page through real ShopContext + router. The cart is
// seeded by the on-mount getUserCart call (token in storage), the product list
// by the on-mount product fetch. Only the network boundary is mocked.
const renderCart = (cartData = { p1: { M: 2 }, p2: { L: 1 } }) => {
  localStorage.setItem('token', 'tok')
  axios.get = vi.fn().mockResolvedValue({
    data: { success: true, products },
  })
  axios.post = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/cart/get')) {
      return Promise.resolve({ data: { success: true, cartData } })
    }
    return Promise.resolve({ data: { success: true } })
  })

  return render(
    <MemoryRouter initialEntries={['/cart']}>
      <ShopContextProvider>
        <Routes>
          <Route path='/cart' element={<Cart />} />
          <Route
            path='/place-order'
            element={<div data-testid='place-order'>Place Order</div>}
          />
        </Routes>
        <LocationProbe />
      </ShopContextProvider>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('Cart Page (integration)', () => {
  it('renders a row per seeded cart item once products and cart load', async () => {
    const { container } = renderCart({ p1: { M: 2 }, p2: { L: 1 } })

    await waitFor(() =>
      expect(container.querySelectorAll('input[type="number"]')).toHaveLength(2)
    )
    expect(screen.getByText('Blue Shirt')).toBeInTheDocument()
    expect(screen.getByText('Red Dress')).toBeInTheDocument()
  })

  it('updating a quantity flows through real updateQuantity and recomputes the subtotal', async () => {
    renderCart({ p1: { M: 2 } }) // subtotal 2 * 100 = 200

    await waitFor(() =>
      expect(screen.getByText('Blue Shirt')).toBeInTheDocument()
    )
    // CartTotal subtotal line: "$ 200.00"
    expect(screen.getByText(/\$\s*200\.00/)).toBeInTheDocument()

    const input = screen.getByDisplayValue('2')
    fireEvent.change(input, { target: { value: '3' } })

    await waitFor(() =>
      expect(screen.getByText(/\$\s*300\.00/)).toBeInTheDocument()
    )
    // update POST hit the network boundary
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/cart/update'),
      { itemId: 'p1', size: 'M', quantity: 3 },
      expect.any(Object)
    )
  })

  it('removing a row via the bin icon drops it from the cart', async () => {
    const { container } = renderCart({ p1: { M: 2 }, p2: { L: 1 } })

    await waitFor(() =>
      expect(container.querySelectorAll('input[type="number"]')).toHaveLength(2)
    )

    const binIcons = container.querySelectorAll('img[class*="cursor-pointer"]')
    fireEvent.click(binIcons[0])

    await waitFor(() =>
      expect(container.querySelectorAll('input[type="number"]')).toHaveLength(1)
    )
  })

  it('checkout navigates to /place-order via the real router', async () => {
    renderCart({ p1: { M: 2 } })

    await waitFor(() =>
      expect(screen.getByText('Blue Shirt')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: 'PROCEED TO CHECKOUT' }))

    await waitFor(() =>
      expect(screen.getByTestId('place-order')).toBeInTheDocument()
    )
    expect(screen.getByTestId('location').textContent).toBe('/place-order')
  })
})
