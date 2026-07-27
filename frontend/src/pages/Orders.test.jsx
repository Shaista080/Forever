import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import Orders from './Orders'
import { ShopContext } from '../context/ShopContext'

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() },
}))

// Title renders MY ORDERS heading; stub to keep this a unit test
vi.mock('../components/Title', () => ({
  default: ({ text1, text2 }) => (
    <div data-testid='title'>
      {text1} {text2}
    </div>
  ),
}))

const makeItem = (overrides = {}) => ({
  name: 'Shirt',
  price: 100,
  quantity: 1,
  size: 'M',
  image: ['img1.png'],
  ...overrides,
})

const makeOrder = (overrides = {}) => ({
  status: 'Order Placed',
  payment: false,
  paymentMethod: 'COD',
  date: 1700000000000,
  items: [makeItem()],
  ...overrides,
})

const renderOrders = (contextValue) =>
  render(
    <ShopContext.Provider
      value={{
        backendUrl: 'http://localhost:1001',
        currency: '$',
        token: 'tkn',
        ...contextValue,
      }}
    >
      <Orders />
    </ShopContext.Provider>
  )

describe('Orders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.post.mockResolvedValue({ data: { success: true, orders: [] } })
  })

  it('does not fetch orders when no token is set', async () => {
    renderOrders({ token: '' })
    await waitFor(() => {})
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('posts to userorders with the auth header when a token is set', async () => {
    renderOrders()
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/order/userorders',
        {},
        { headers: { Authorization: 'Bearer tkn' } }
      )
    })
  })

  it('renders an order row with product details from the response', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, orders: [makeOrder()] },
    })
    renderOrders()

    expect(await screen.findByText('Shirt')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
    expect(screen.getByText('Size: M')).toBeInTheDocument()
    expect(screen.getByText('Order Placed')).toBeInTheDocument()
  })

  it('flattens items across multiple orders into individual rows', async () => {
    axios.post.mockResolvedValue({
      data: {
        success: true,
        orders: [
          makeOrder({
            items: [makeItem({ name: 'A' }), makeItem({ name: 'B' })],
          }),
          makeOrder({ items: [makeItem({ name: 'C' })] }),
        ],
      },
    })
    renderOrders()

    expect(await screen.findByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('renders at most the first 4 items', async () => {
    const items = Array.from({ length: 6 }, (_, i) =>
      makeItem({ name: `Item ${i}` })
    )
    axios.post.mockResolvedValue({
      data: { success: true, orders: [makeOrder({ items })] },
    })
    renderOrders()

    // reversed then sliced(0,4): last 4 pushed items survive
    expect(await screen.findByText('Item 5')).toBeInTheDocument()
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Item 0')).not.toBeInTheDocument()
  })

  it('refetches when Track Order is clicked', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, orders: [makeOrder()] },
    })
    renderOrders()

    await screen.findByText('Shirt')
    expect(axios.post).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Track Order' }))
    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2))
  })

  it('shows an error toast when the request fails', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    renderOrders()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })

  it('renders no order rows when the API responds success: false', async () => {
    axios.post.mockResolvedValue({ data: { success: false } })
    const { container } = renderOrders()

    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    expect(
      screen.queryByRole('button', { name: 'Track Order' })
    ).not.toBeInTheDocument()
    expect(container.querySelector('img')).not.toBeInTheDocument()
  })
})
