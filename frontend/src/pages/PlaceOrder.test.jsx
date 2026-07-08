import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PlaceOrder from './PlaceOrder'
import { ShopContext } from '../context/ShopContext'

vi.mock('axios')
import axios from 'axios'

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))
import { toast } from 'react-toastify'

vi.mock('../components/CartTotal', () => ({
  default: () => <div data-testid='cart-total'>CartTotal</div>,
}))

vi.mock('../components/Title', () => ({
  default: ({ text1, text2 }) => (
    <div>
      {text1} {text2}
    </div>
  ),
}))

// Payment-method rows, in DOM order: [stripe, razorpay, cod].
const methodRows = (container) =>
  container.querySelectorAll('div.border.cursor-pointer')

const products = [{ _id: 'p1', name: 'Shirt', price: 100, image: ['s.png'] }]

const mockNavigate = vi.fn()
const mockSetCartItems = vi.fn()

const ctxValue = (overrides = {}) => ({
  products,
  delivery_fee: 10,
  cartItems: { p1: { M: 2 } },
  getCartAmount: () => 200,
  navigate: mockNavigate,
  backendUrl: 'http://api.test',
  token: 'tok',
  setCartItems: mockSetCartItems,
  ...overrides,
})

const renderPage = (overrides) =>
  render(
    <ShopContext.Provider value={ctxValue(overrides)}>
      <PlaceOrder />
    </ShopContext.Provider>
  )

const fillForm = () => {
  fireEvent.change(screen.getByPlaceholderText('First name'), {
    target: { name: 'firstName', value: 'Alice' },
  })
  fireEvent.change(screen.getByPlaceholderText('Email address'), {
    target: { name: 'email', value: 'a@b.com' },
  })
}

// Submit via the form element — button click runs jsdom constraint validation
// and would block on the many `required` fields.
const submit = (container) =>
  fireEvent.submit(container.querySelector('form'))

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom navigation stub
  delete window.location
  window.location = { replace: vi.fn() }
})

describe('PlaceOrder Page', () => {
  it('renders address fields and the place order button', () => {
    renderPage()
    expect(screen.getByPlaceholderText('First name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Street')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('City')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Zipcode')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'PLACE ORDER' })
    ).toBeInTheDocument()
  })

  it('updates a form field on change', () => {
    renderPage()
    const first = screen.getByPlaceholderText('First name')
    fireEvent.change(first, { target: { name: 'firstName', value: 'Bob' } })
    expect(first).toHaveValue('Bob')
  })

  it('selects COD by default and toggles the selected method on click', () => {
    const { container } = renderPage()
    const codDot = screen.getByText('CASH ON DELIVERY').previousSibling
    expect(codDot).toHaveClass('bg-green-400')

    // clicking stripe (first method row) moves the highlight
    const stripeRow = methodRows(container)[0]
    fireEvent.click(stripeRow)
    expect(stripeRow.querySelector('p')).toHaveClass('bg-green-400')
    expect(codDot).not.toHaveClass('bg-green-400')
  })

  describe('COD submit', () => {
    it('posts order with items, amount, and auth header, then clears cart and navigates', async () => {
      axios.post = vi.fn().mockResolvedValue({ data: { success: true } })

      const { container } = renderPage()
      fillForm()
      submit(container)

      await waitFor(() => expect(axios.post).toHaveBeenCalled())
      const [url, body, config] = axios.post.mock.calls[0]
      expect(url).toContain('/api/order/place')
      expect(body.amount).toBe(210) // 200 + 10
      expect(body.items).toEqual([
        { _id: 'p1', name: 'Shirt', price: 100, image: ['s.png'], size: 'M', quantity: 2 },
      ])
      expect(body.address.firstName).toBe('Alice')
      expect(config.headers.Authorization).toBe('Bearer tok')

      await waitFor(() => expect(mockSetCartItems).toHaveBeenCalledWith({}))
      expect(mockNavigate).toHaveBeenCalledWith('/orders')
    })

    it('toasts an error and does not navigate when the server returns success false', async () => {
      axios.post = vi
        .fn()
        .mockResolvedValue({ data: { success: false, message: 'Out of stock' } })

      const { container } = renderPage()
      fillForm()
      submit(container)

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Out of stock')
      )
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockSetCartItems).not.toHaveBeenCalled()
    })

    it('skips cart entries with quantity 0 and products not found', async () => {
      axios.post = vi.fn().mockResolvedValue({ data: { success: true } })

      const { container } = renderPage({ cartItems: { p1: { M: 2, L: 0 }, ghost: { S: 3 } } })
      fillForm()
      submit(container)

      await waitFor(() => expect(axios.post).toHaveBeenCalled())
      const body = axios.post.mock.calls[0][1]
      expect(body.items).toHaveLength(1)
      expect(body.items[0].size).toBe('M')
    })
  })

  describe('Stripe submit', () => {
    it('posts to the stripe endpoint and redirects to the session url on success', async () => {
      axios.post = vi.fn().mockResolvedValue({
        data: { success: true, session_url: 'https://stripe/session' },
      })

      const { container } = renderPage()
      fireEvent.click(methodRows(container)[0])
      fillForm()
      submit(container)

      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('/api/order/stripe'),
          expect.any(Object),
          expect.any(Object)
        )
      )
      await waitFor(() =>
        expect(window.location.replace).toHaveBeenCalledWith(
          'https://stripe/session'
        )
      )
    })

    it('toasts an error when the stripe response is not successful', async () => {
      axios.post = vi
        .fn()
        .mockResolvedValue({ data: { success: false, message: 'Stripe down' } })

      const { container } = renderPage()
      fireEvent.click(methodRows(container)[0])
      fillForm()
      submit(container)

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Stripe down')
      )
      expect(window.location.replace).not.toHaveBeenCalled()
    })
  })

  it('toasts the error message when the request throws', async () => {
    axios.post = vi.fn().mockRejectedValue(new Error('Network fail'))

    const { container } = renderPage()
    fillForm()
    submit(container)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network fail')
    )
  })
})
