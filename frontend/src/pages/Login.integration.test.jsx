import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import Login from './Login'
import { MemoryRouter } from 'react-router-dom'

// Mock external dependencies
vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// Create a helper to render the component with a provider
const renderWithContext = (contextValue) => {
  return render(
    <MemoryRouter>
      <ShopContext.Provider value={contextValue}>
        <Login />
      </ShopContext.Provider>
    </MemoryRouter>
  )
}

describe('Login Form Integration Tests', () => {
  let mockNavigate
  let mockSetToken
  let localStorageSpy

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate = vi.fn()
    mockSetToken = vi.fn()
    axios.post.mockResolvedValue({ data: {} })
    localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
  })

  afterEach(() => {
    localStorageSpy.mockRestore()
    localStorage.clear()
  })

  const getContextValue = () => ({
    token: null,
    setToken: mockSetToken,
    navigate: mockNavigate,
    backendUrl: 'http://localhost:1001',
  })

  it('should handle successful login, store token, and navigate to home', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, token: 'fake-jwt-token' },
    })
    renderWithContext(getContextValue())

    // Fill and submit the login form (default state is Login)
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/user/login',
        {
          email: 'test@example.com',
          password: 'Password123!',
        }
      )
    })

    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('fake-jwt-token')
      expect(localStorageSpy).toHaveBeenCalledWith('token', 'fake-jwt-token')
    })
  })

  it('should show an error toast and not store a token when login fails', async () => {
    axios.post.mockResolvedValue({
      data: { success: false, message: 'Invalid Credentials' },
    })
    const { toast } = await import('react-toastify')
    renderWithContext(getContextValue())

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid Credentials')
    })

    expect(mockSetToken).not.toHaveBeenCalled()
    expect(localStorageSpy).not.toHaveBeenCalled()
  })

  it('should show an error when the network request fails', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'))
    const { toast } = await import('react-toastify')
    renderWithContext(getContextValue())

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network Error')
    })

    expect(mockSetToken).not.toHaveBeenCalled()
  })
})
