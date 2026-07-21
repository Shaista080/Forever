import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import Verify from './Verify'
import { ShopContext } from '../context/ShopContext'

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn() },
}))

// Control the query string Verify reads
let mockParams = new URLSearchParams('success=true&orderId=order-1')
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockParams],
}))

const renderVerify = (contextValue) =>
  render(
    <ShopContext.Provider
      value={{
        backendUrl: 'http://localhost:1001',
        token: 'tkn',
        navigate: vi.fn(),
        setCartItems: vi.fn(),
        ...contextValue,
      }}
    >
      <Verify />
    </ShopContext.Provider>
  )

describe('Verify Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams = new URLSearchParams('success=true&orderId=order-1')
    axios.post.mockResolvedValue({ data: { success: true } })
  })

  it('does not call the API when no token is set', async () => {
    renderVerify({ token: '' })
    await waitFor(() => {})
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('posts success and orderId with the auth header', async () => {
    renderVerify()
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/order/verifystripe',
        { success: 'true', orderId: 'order-1' },
        { headers: { Authorization: 'Bearer tkn' } }
      )
    })
  })

  it('clears the cart and navigates to /orders on success', async () => {
    const navigate = vi.fn()
    const setCartItems = vi.fn()
    renderVerify({ navigate, setCartItems })

    await waitFor(() => {
      expect(setCartItems).toHaveBeenCalledWith({})
      expect(navigate).toHaveBeenCalledWith('/orders')
    })
  })

  it('navigates to /cart when verification is unsuccessful', async () => {
    axios.post.mockResolvedValue({ data: { success: false } })
    const navigate = vi.fn()
    const setCartItems = vi.fn()
    renderVerify({ navigate, setCartItems })

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/cart'))
    expect(setCartItems).not.toHaveBeenCalled()
  })

  it('shows an error toast when the request fails', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    renderVerify()

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    )
  })
})
