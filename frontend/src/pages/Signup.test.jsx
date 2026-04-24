import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login'
import useAuthForm from '../hooks/useAuthForm'

// Mock the custom hook
vi.mock('../hooks/useAuthForm')

describe('Login Component (Sign Up State)', () => {
  // Create mock functions that can be reused in tests
  const mockSetCurrentState = vi.fn()
  const mockSetName = vi.fn()
  const mockSetEmail = vi.fn()
  const mockSetPassword = vi.fn()
  const mockSetConfirmPassword = vi.fn()
  const mockOnSubmitHandler = vi.fn((e) => e.preventDefault())

  // Set a default mock implementation for all tests
  const mockAuthForm = (overrides = {}) => {
    useAuthForm.mockReturnValue({
      currentState: 'Sign Up',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      setCurrentState: mockSetCurrentState,
      setName: mockSetName,
      setEmail: mockSetEmail,
      setPassword: mockSetPassword,
      setConfirmPassword: mockSetConfirmPassword,
      onSubmitHandler: mockOnSubmitHandler,
      ...overrides,
    })
  }

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    mockAuthForm()
  })

  describe('Rendering', () => {
    it('should render the complete Sign Up form correctly', () => {
      render(<Login />)

      // Assert titles and buttons
      expect(
        screen.getByRole('heading', { name: /Sign Up/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /Sign Up/i })
      ).toBeInTheDocument()
      expect(screen.getByText('Login Here')).toBeInTheDocument()

      // Assert input fields are present
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Confirm Password')
      ).toBeInTheDocument()

      // Assert elements that should NOT be present
      expect(
        screen.queryByText('Forgot your password?')
      ).not.toBeInTheDocument()
    })

    it('should render input values from the hook', () => {
      mockAuthForm({
        name: 'John',
        email: 'john@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })

      render(<Login />)

      expect(screen.getByPlaceholderText('Name')).toHaveValue('John')
      expect(screen.getByPlaceholderText('Email')).toHaveValue('john@test.com')
      expect(screen.getByPlaceholderText('Password')).toHaveValue(
        'Password123!'
      )
      expect(screen.getByPlaceholderText('Confirm Password')).toHaveValue(
        'Password123!'
      )
    })
  })

  describe('User Interactions', () => {
    it('should call setName when user types in the name field', () => {
      render(<Login />)
      const nameInput = screen.getByPlaceholderText('Name')
      fireEvent.change(nameInput, { target: { value: 'John' } })
      expect(mockSetName).toHaveBeenCalledWith('John')
    })

    it('should call setEmail when user types in the email field', () => {
      render(<Login />)
      const emailInput = screen.getByPlaceholderText('Email')
      fireEvent.change(emailInput, { target: { value: 'test@email.com' } })
      expect(mockSetEmail).toHaveBeenCalledWith('test@email.com')
    })

    it('should call setPassword when user types in the password field', () => {
      render(<Login />)
      const passwordInput = screen.getByPlaceholderText('Password')
      fireEvent.change(passwordInput, { target: { value: 'pass123' } })
      expect(mockSetPassword).toHaveBeenCalledWith('pass123')
    })

    it('should call setConfirmPassword when user types in the confirm password field', () => {
      render(<Login />)
      const confirmPasswordInput =
        screen.getByPlaceholderText('Confirm Password')
      fireEvent.change(confirmPasswordInput, { target: { value: 'pass123' } })
      expect(mockSetConfirmPassword).toHaveBeenCalledWith('pass123')
    })

    it('should call onSubmitHandler when the Sign Up button is clicked', () => {
      mockAuthForm({
        name: 'John',
        email: 'john@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })
      render(<Login />)

      const signUpButton = screen.getByRole('button', { name: /Sign Up/i })
      fireEvent.click(signUpButton)
      expect(mockOnSubmitHandler).toHaveBeenCalledTimes(1)
    })

    it('should call setCurrentState when the "Login Here" link is clicked', () => {
      render(<Login />)
      const loginLink = screen.getByText('Login Here')
      fireEvent.click(loginLink)
      expect(mockSetCurrentState).toHaveBeenCalledWith('Login')
    })
  })
})
