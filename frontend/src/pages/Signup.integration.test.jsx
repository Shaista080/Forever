import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { ShopContext } from '../context/ShopContext'
import Login from './Login' // The component we are testing
import { MemoryRouter } from 'react-router-dom' // To mock navigation

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

describe('Signup Form Integration Tests', () => {
  let mockNavigate
  let mockSetToken
  let localStorageSpy

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Default mock implementations
    mockNavigate = vi.fn()
    mockSetToken = vi.fn()
    axios.post.mockResolvedValue({ data: {} }) // Default happy path

    // Spy on localStorage
    localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
  })

  afterEach(() => {
    // Restore localStorage spy
    localStorageSpy.mockRestore()
    localStorage.clear()
  })

  const getContextValue = () => ({
    token: null,
    setToken: mockSetToken,
    navigate: mockNavigate,
    backendUrl: 'http://localhost:1001',
  })

  // Test 1: Successful Signup
  it('should handle successful signup, store token, and navigate to home', async () => {
    // Arrange: Mock a successful API response
    axios.post.mockResolvedValue({
      data: { success: true, token: 'fake-jwt-token' },
    })
    renderWithContext(getContextValue())

    // Act: Switch to signup and fill out the form
    fireEvent.click(screen.getByText('Create account'))
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    // Assert: Check API call, token storage, and navigation
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/user/register',
        {
          name: 'Test User',
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

  // Test 2: Signup with an existing email
  it('should show an error message when signing up with an existing email', async () => {
    // Arrange: Mock an API response for a duplicate user
    axios.post.mockResolvedValue({
      data: { success: false, message: 'User already exists' },
    })
    const { toast } = await import('react-toastify')
    renderWithContext(getContextValue())

    // Act: Fill and submit the form
    fireEvent.click(screen.getByText('Create account'))
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'existing@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    // Assert: Check for the error toast and that no token is set
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('User already exists')
    })

    expect(mockSetToken).not.toHaveBeenCalled()
    expect(localStorageSpy).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // Test 3: Signup with non-matching passwords
  it('should show a validation error if passwords do not match', async () => {
    const { toast } = await import('react-toastify')
    renderWithContext(getContextValue())

    // Act: Fill form with non-matching passwords
    fireEvent.click(screen.getByText('Create account'))
    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'Test User' },
    })
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'Password123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'WrongPassword' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    // Assert: Check for the validation error and that no API call was made
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Passwords don't match")
    })
    expect(axios.post).not.toHaveBeenCalled()
  })
})
