import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'
import useAuthForm from './useAuthForm'

// Mock external dependencies
vi.mock('axios')
vi.mock('react-toastify')

// Create a wrapper component to provide the mock context
const createWrapper = (contextValue) => {
  const Wrapper = ({ children }) => (
    <ShopContext.Provider value={contextValue}>{children}</ShopContext.Provider>
  )
  return Wrapper
}

describe('useAuthForm Hook', () => {
  let mockNavigate
  let mockSetToken
  let localStorageSpy

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Setup default mock implementations
    mockNavigate = vi.fn()
    mockSetToken = vi.fn()
    axios.post.mockResolvedValue({ data: {} }) // Default happy path
    toast.error.mockClear()

    // Spy on localStorage
    localStorageSpy = vi.spyOn(Storage.prototype, 'setItem')
  })

  afterEach(() => {
    // Restore localStorage spy
    localStorageSpy.mockRestore()
  })

  const renderAuthHook = (contextValue = {}) => {
    const defaultContext = {
      token: null,
      setToken: mockSetToken,
      navigate: mockNavigate,
      backendUrl: 'http://localhost:1001',
      ...contextValue,
    }
    return renderHook(() => useAuthForm(), {
      wrapper: createWrapper(defaultContext),
    })
  }

  describe('Sign-Up Validation Logic', () => {
    it('should call toast.error if passwords do not match', async () => {
      const { result } = renderAuthHook()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setPassword('password123')
        result.current.setConfirmPassword('wrong-password')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith("Passwords don't match")
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should call toast.error if password is less than 8 characters', async () => {
      const { result } = renderAuthHook()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setPassword('short')
        result.current.setConfirmPassword('short')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith(
        'Password must be at least 8 characters long'
      )
      expect(axios.post).not.toHaveBeenCalled()
    })

    it('should call toast.error if password has no special characters', async () => {
      const { result } = renderAuthHook()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setPassword('longPassword')
        result.current.setConfirmPassword('longPassword')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith(
        'Password must contain at least one special character'
      )
      expect(axios.post).not.toHaveBeenCalled()
    })
  })

  describe('Sign-Up API Calls', () => {
    it('should make a POST request to the register endpoint and handle success', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, token: 'fake-token' },
      })
      const { result } = renderAuthHook()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setName('John')
        result.current.setEmail('john@test.com')
        result.current.setPassword('ValidPass123!')
        result.current.setConfirmPassword('ValidPass123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/user/register',
        {
          name: 'John',
          email: 'john@test.com',
          password: 'ValidPass123!',
        }
      )
      expect(mockSetToken).toHaveBeenCalledWith('fake-token')
      expect(localStorageSpy).toHaveBeenCalledWith('token', 'fake-token')
    })

    it('should call toast.error with the API message on a failed registration', async () => {
      axios.post.mockResolvedValue({
        data: { success: false, message: 'API error from test' },
      })
      const { result } = renderAuthHook()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setName('John')
        result.current.setEmail('john@test.com')
        result.current.setPassword('ValidPass123!')
        result.current.setConfirmPassword('ValidPass123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith('API error from test')
    })

    it('should call toast.error when registration request throws', async () => {
      axios.post.mockRejectedValue(new Error('Network error'))

      const { result } = renderAuthHook()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setName('John')
        result.current.setEmail('john@test.com')
        result.current.setPassword('ValidPass123!')
        result.current.setConfirmPassword('ValidPass123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith('Network error')
    })

    it('should call preventDefault when the form is submitted', async () => {
      const { result } = renderAuthHook()
      const preventDefault = vi.fn()

      act(() => {
        result.current.setCurrentState('Sign Up')
        result.current.setName('John')
        result.current.setEmail('john@test.com')
        result.current.setPassword('ValidPass123!')
        result.current.setConfirmPassword('ValidPass123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault })
      })

      expect(preventDefault).toHaveBeenCalledTimes(1)
    })
  })

  describe('Login API Calls', () => {
    it('should make a POST request to the login endpoint and handle success', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, token: 'login-token' },
      })
      const { result } = renderAuthHook()

      act(() => {
        result.current.setEmail('john@test.com')
        result.current.setPassword('Password123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/user/login',
        {
          email: 'john@test.com',
          password: 'Password123!',
        }
      )
      expect(mockSetToken).toHaveBeenCalledWith('login-token')
      expect(localStorageSpy).toHaveBeenCalledWith('token', 'login-token')
    })

    it('should call toast.error with the API message on a failed login', async () => {
      axios.post.mockResolvedValue({
        data: { success: false, message: 'Invalid credentials' },
      })
      const { result } = renderAuthHook()

      act(() => {
        result.current.setEmail('john@test.com')
        result.current.setPassword('Password123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith('Invalid credentials')
      expect(mockSetToken).not.toHaveBeenCalled()
    })

    it('should call toast.error when login request throws', async () => {
      axios.post.mockRejectedValue(new Error('Network error'))
      const { result } = renderAuthHook()

      act(() => {
        result.current.setEmail('john@test.com')
        result.current.setPassword('Password123!')
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      expect(toast.error).toHaveBeenCalledWith('Network error')
    })

    it('should skip password validation and call the API directly', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, token: 'login-token' },
      })
      const { result } = renderAuthHook()

      act(() => {
        result.current.setEmail('john@test.com')
        result.current.setPassword('short') // No special char, under 8 chars
      })

      await act(async () => {
        await result.current.onSubmitHandler({ preventDefault: () => {} })
      })

      // Login should NOT run validation — API should still be called
      expect(toast.error).not.toHaveBeenCalled()
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:1001/api/user/login',
        {
          email: 'john@test.com',
          password: 'short',
        }
      )
    })
  })

  describe('Redirection Effect', () => {
    it('should not call navigate("/") on initial render if no token is present', () => {
      renderAuthHook({ token: null })
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should call navigate("/") on initial render if a token is present', () => {
      renderAuthHook({ token: 'a-real-token' })
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('Default State', () => {
    it('should initialize with Login state and empty fields', () => {
      const { result } = renderAuthHook()

      expect(result.current.currentState).toBe('Login')
      expect(result.current.name).toBe('')
      expect(result.current.email).toBe('')
      expect(result.current.password).toBe('')
      expect(result.current.confirmPassword).toBe('')
    })
  })
})
