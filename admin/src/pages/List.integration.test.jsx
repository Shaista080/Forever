import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import List from './List'

vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
  currency: '$',
}))

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const products = [
  {
    _id: 'p1',
    name: 'Blue Shirt',
    category: 'Men',
    price: 49,
    image: ['b.png'],
  },
]

describe('Admin List Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({ data: { success: true, products } })
    axios.post.mockResolvedValue({
      data: { success: true, message: 'Product Removed' },
    })
  })

  it('fetches the product list from the API on mount', async () => {
    render(<List token='tkn' />)

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:1001/api/product/list'
      )
    })
    expect(await screen.findByText('Blue Shirt')).toBeInTheDocument()
  })

  it('shows an error toast when the fetch is unsuccessful', async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: 'Server error' },
    })
    const { toast } = await import('react-toastify')
    render(<List token='tkn' />)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Server error')
    )
  })

  it('removes a product with the auth header and refetches on success', async () => {
    const { toast } = await import('react-toastify')
    render(<List token='tkn' />)
    await screen.findByText('Blue Shirt')

    // second fetch (after removal) returns an empty list
    axios.get.mockResolvedValue({ data: { success: true, products: [] } })

    fireEvent.click(screen.getByText('X'))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/product/remove',
        { id: 'p1' },
        { headers: { Authorization: 'Bearer tkn' } }
      )
    })
    expect(toast.success).toHaveBeenCalledWith('Product Removed')

    // refetch cleared the row
    await waitFor(() =>
      expect(screen.queryByText('Blue Shirt')).not.toBeInTheDocument()
    )
  })

  it('shows an error toast when the fetch request rejects', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    render(<List token='tkn' />)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })

  it('shows an error toast when the remove request rejects', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    render(<List token='tkn' />)
    await screen.findByText('Blue Shirt')

    fireEvent.click(screen.getByText('X'))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })

  it('shows an error toast and does not refetch when removal fails', async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: 'Not allowed' },
    })
    const { toast } = await import('react-toastify')
    render(<List token='tkn' />)
    await screen.findByText('Blue Shirt')

    axios.get.mockClear()
    fireEvent.click(screen.getByText('X'))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Not allowed'))
    expect(axios.get).not.toHaveBeenCalled()
  })
})
