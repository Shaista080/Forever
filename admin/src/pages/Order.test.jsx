import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import Order from './Order'

vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
  currency: '$',
}))

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const makeOrder = (overrides = {}) => ({
  _id: 'o1',
  items: [
    { name: 'Shirt', quantity: 2, size: 'M' },
    { name: 'Hat', quantity: 1, size: 'L' },
  ],
  amount: 210,
  address: {
    firstName: 'Jane',
    lastName: 'Doe',
    street: '1 Main St',
    city: 'Town',
    state: 'ST',
    country: 'US',
    zipcode: '12345',
    phone: '555-1234',
  },
  status: 'Order Placed',
  paymentMethod: 'COD',
  payment: false,
  date: 1700000000000,
  ...overrides,
})

describe('Admin Order Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.post.mockResolvedValue({
      data: { success: true, orders: [makeOrder()] },
    })
  })

  it('does not fetch when no token is set', async () => {
    render(<Order token='' />)
    await waitFor(() => {})
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('renders the static heading', async () => {
    render(<Order token='tkn' />)
    expect(await screen.findByText('Order Page')).toBeInTheDocument()
  })

  it('renders order items, customer name and address', async () => {
    render(<Order token='tkn' />)

    expect(await screen.findByText(/Shirt x 2/)).toBeInTheDocument()
    expect(screen.getByText(/Hat x 1/)).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('1 Main St,')).toBeInTheDocument()
    expect(screen.getByText('555-1234')).toBeInTheDocument()
  })

  it('renders item count, payment method, pending status and amount', async () => {
    render(<Order token='tkn' />)
    await screen.findByText('Order Page')

    expect(screen.getByText('Items : 2')).toBeInTheDocument()
    expect(screen.getByText('Method : COD')).toBeInTheDocument()
    expect(screen.getByText('Payment : Pending')).toBeInTheDocument()
    expect(screen.getByText(/\$ 210/)).toBeInTheDocument()
  })

  it("shows 'Done' when payment is true", async () => {
    axios.post.mockResolvedValue({
      data: { success: true, orders: [makeOrder({ payment: true })] },
    })
    render(<Order token='tkn' />)

    expect(await screen.findByText('Payment : Done')).toBeInTheDocument()
  })

  it('renders the status select reflecting the order status', async () => {
    render(<Order token='tkn' />)
    await screen.findByText('Order Page')

    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('Order Placed')
  })
})
