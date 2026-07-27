import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useContext } from 'react'
import ShopContextProvider, { ShopContext } from './ShopContext'

vi.mock('axios')
import axios from 'axios'

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
import { toast } from 'react-toastify'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Harness exposes context value via data attributes / buttons.
let ctx
const Consumer = () => {
  ctx = useContext(ShopContext)
  return (
    <div>
      <span data-testid='count'>{ctx.getCartCount()}</span>
      <span data-testid='amount'>{ctx.getCartAmount()}</span>
    </div>
  )
}

const products = [
  { _id: 'p1', name: 'A', price: 100 },
  { _id: 'p2', name: 'B', price: 50 },
]

const renderProvider = () =>
  render(
    <ShopContextProvider>
      <Consumer />
    </ShopContextProvider>
  )

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  // Default product list fetch on mount.
  axios.get = vi.fn().mockResolvedValue({
    data: { success: true, products },
  })
  axios.post = vi.fn().mockResolvedValue({
    data: { success: true, cartData: {} },
  })
})

describe('ShopContext', () => {
  describe('addToCart', () => {
    it('rejects and toasts an error when no size is given', async () => {
      renderProvider()
      await ctx.addToCart('p1', '')
      expect(toast.error).toHaveBeenCalledWith('Select product size!')
      expect(ctx.cartItems).toEqual({})
    })

    it('adds a new item with quantity 1', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems).toEqual({ p1: { M: 1 } }))
    })

    it('increments quantity when same item and size added again', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(1))
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(2))
    })

    it('adds a new size to an existing item', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(1))
      await ctx.addToCart('p1', 'L')
      await waitFor(() => expect(ctx.cartItems.p1).toEqual({ M: 1, L: 1 }))
    })

    it('POSTs to /api/cart/add when a token is set', async () => {
      localStorage.setItem('token', 'tok')
      renderProvider()
      await waitFor(() => expect(ctx.token).toBe('tok'))
      await ctx.addToCart('p1', 'M')
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/cart/add'),
          { itemId: 'p1', size: 'M' },
          expect.objectContaining({
            headers: { Authorization: 'Bearer tok' },
          })
        )
      )
    })

    it('does not POST when no token is set', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(1))
      expect(axios.post).not.toHaveBeenCalled()
    })
  })

  describe('getCartCount', () => {
    it('sums all quantities across items and sizes', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1?.M).toBe(1))
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1?.M).toBe(2))
      await ctx.addToCart('p2', 'L')
      await waitFor(() =>
        expect(screen.getByTestId('count').textContent).toBe('3')
      )
    })

    it('returns 0 for an empty cart', () => {
      renderProvider()
      expect(screen.getByTestId('count').textContent).toBe('0')
    })
  })

  describe('updateQuantity', () => {
    it('sets the quantity for an item size', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(1))
      await ctx.updateQuantity('p1', 'M', 5)
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(5))
    })

    it('POSTs to /api/cart/update when a token is set', async () => {
      localStorage.setItem('token', 'tok')
      axios.post = vi.fn().mockResolvedValue({
        data: { success: true, cartData: { p1: { M: 1 } } },
      })
      renderProvider()
      await waitFor(() => expect(ctx.cartItems.p1?.M).toBe(1))
      await ctx.updateQuantity('p1', 'M', 3)
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/cart/update'),
          { itemId: 'p1', size: 'M', quantity: 3 },
          expect.objectContaining({
            headers: { Authorization: 'Bearer tok' },
          })
        )
      )
    })

    it('does not POST when no token is set', async () => {
      renderProvider()
      await ctx.addToCart('p1', 'M')
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(1))
      axios.post.mockClear()
      await ctx.updateQuantity('p1', 'M', 4)
      await waitFor(() => expect(ctx.cartItems.p1.M).toBe(4))
      expect(axios.post).not.toHaveBeenCalled()
    })
  })

  describe('getCartAmount', () => {
    it('sums price times quantity across items', async () => {
      renderProvider()
      await waitFor(() => expect(ctx.products).toHaveLength(2))
      await ctx.addToCart('p1', 'M') // 100
      await waitFor(() => expect(ctx.cartItems.p1?.M).toBe(1))
      await ctx.addToCart('p2', 'L') // 50
      await waitFor(() => expect(ctx.cartItems.p2?.L).toBe(1))
      await ctx.addToCart('p2', 'L') // +50
      await waitFor(() => expect(ctx.cartItems.p2?.L).toBe(2))
      await waitFor(() =>
        expect(screen.getByTestId('amount').textContent).toBe('200')
      )
    })

    it('returns 0 for an empty cart', () => {
      renderProvider()
      expect(screen.getByTestId('amount').textContent).toBe('0')
    })
  })

  describe('getUserCart', () => {
    it('sets cartItems from the cart fetched on mount when token in storage', async () => {
      localStorage.setItem('token', 'tok')
      axios.post = vi.fn().mockResolvedValue({
        data: { success: true, cartData: { p1: { M: 2 } } },
      })
      renderProvider()
      await waitFor(() => expect(ctx.cartItems).toEqual({ p1: { M: 2 } }))
    })
  })
})
