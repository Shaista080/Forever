import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

const baseOrder = {
  _id: 'o1',
  items: [{ name: 'Shirt', quantity: 1, size: 'M' }],
  amount: 110,
  address: {
    firstName: 'Jane',
    lastName: 'Doe',
    street: '1 Main St',
    city: 'Town',
    state: 'ST',
    country: 'US',
    zipcode: '12345',
    phone: '555',
  },
  status: 'Order Placed',
  paymentMethod: 'COD',
  payment: false,
  date: 1700000000000,
}

// post routes by URL: /order/list (fetch) vs /order/status (update)
const listResponse = (orders) => ({ data: { success: true, orders } })

describe('Admin Order Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/api/order/list')) {
        return Promise.resolve(listResponse([{ ...baseOrder }]))
      }
      if (url.endsWith('/api/order/status')) {
        return Promise.resolve({
          data: { success: true, message: 'Status updated' },
        })
      }
      return Promise.resolve({ data: { success: true } })
    })
  })

  it('fetches all orders with the auth header on mount', async () => {
    render(<Order token='tkn' />)

    await waitFor(() => {
      const call = axios.post.mock.calls.find(([u]) =>
        u.endsWith('/api/order/list')
      )
      expect(call).toBeTruthy()
      expect(call[2]).toEqual({ headers: { Authorization: 'Bearer tkn' } })
    })
    expect(await screen.findByText(/Shirt x 1/)).toBeInTheDocument()
  })

  it('shows an error toast when the fetch is unsuccessful', async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: 'Forbidden' },
    })
    const { toast } = await import('react-toastify')
    render(<Order token='tkn' />)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Forbidden'))
  })

  it('shows an error toast when the fetch request rejects', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    render(<Order token='tkn' />)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })

  it('updates status via the API and refetches on change', async () => {
    const { toast } = await import('react-toastify')
    render(<Order token='tkn' />)
    await screen.findByText(/Shirt x 1/)

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Shipped' },
    })

    await waitFor(() => {
      const call = axios.post.mock.calls.find(([u]) =>
        u.endsWith('/api/order/status')
      )
      expect(call[1]).toEqual({ orderId: 'o1', status: 'Shipped' })
      expect(call[2]).toEqual({ headers: { Authorization: 'Bearer tkn' } })
    })
    expect(toast.success).toHaveBeenCalledWith('Status updated')

    // status change triggers a refetch of the list
    await waitFor(() => {
      const listCalls = axios.post.mock.calls.filter(([u]) =>
        u.endsWith('/api/order/list')
      )
      expect(listCalls.length).toBe(2)
    })
  })

  it('shows an error toast when the status update rejects', async () => {
    axios.post.mockImplementation((url) => {
      if (url.endsWith('/api/order/list')) {
        return Promise.resolve(listResponse([{ ...baseOrder }]))
      }
      return Promise.reject(new Error('Network Error'))
    })
    const { toast } = await import('react-toastify')
    render(<Order token='tkn' />)
    await screen.findByText(/Shirt x 1/)

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Delivered' },
    })

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })
})
