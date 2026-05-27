import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import Login from './Login'

// Provide a deterministic backendUrl without loading the real App tree.
vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
}))

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}))

const fillAndSubmit = ({ email, password }) => {
  fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
    target: { value: email },
  })
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: password },
  })
  fireEvent.click(screen.getByRole('button', { name: /Login/i }))
}

describe('Admin Login Integration Tests', () => {
  let mockSetToken

  beforeEach(() => {
    vi.clearAllMocks()
    mockSetToken = vi.fn()
    axios.post.mockResolvedValue({ data: {} })
  })

  it('should post to the admin endpoint and store the token on success', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, token: 'fake-admin-token' },
    })
    render(<Login setToken={mockSetToken} />)

    fillAndSubmit({ email: 'admin@test.com', password: 'Password123!' })

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/user/admin',
        {
          email: 'admin@test.com',
          password: 'Password123!',
        }
      )
    })

    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('fake-admin-token')
    })
  })

  it('should show an error toast and not store a token when login fails', async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: 'Invalid Credentials' },
    })
    const { toast } = await import('react-toastify')
    render(<Login setToken={mockSetToken} />)

    fillAndSubmit({ email: 'admin@test.com', password: 'wrongpassword' })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid Credentials')
    })

    expect(mockSetToken).not.toHaveBeenCalled()
  })

  it('should not store a token or show a toast when the request rejects', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    render(<Login setToken={mockSetToken} />)

    fillAndSubmit({ email: 'admin@test.com', password: 'Password123!' })

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled()
    })

    expect(mockSetToken).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
