import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Login from './Login'

// Mock the App module so we don't pull in the router/dashboard tree
// and so backendUrl is deterministic in tests.
vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
}))

// Submit calls axios; mock it so unit tests never hit the network.
vi.mock('axios')

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('Admin Login Component', () => {
  const mockSetToken = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the admin login form correctly', () => {
      render(<Login setToken={mockSetToken} />)

      expect(
        screen.getByRole('heading', { name: /Admin Panel/i })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()

      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
      expect(
        screen.getByPlaceholderText('Enter your password')
      ).toBeInTheDocument()
    })

    it('should start with empty email and password fields', () => {
      render(<Login setToken={mockSetToken} />)

      expect(screen.getByPlaceholderText('your@email.com')).toHaveValue('')
      expect(screen.getByPlaceholderText('Enter your password')).toHaveValue('')
    })
  })

  describe('User Interactions', () => {
    it('should update the email field when the user types', () => {
      render(<Login setToken={mockSetToken} />)
      const emailInput = screen.getByPlaceholderText('your@email.com')
      fireEvent.change(emailInput, { target: { value: 'admin@test.com' } })
      expect(emailInput).toHaveValue('admin@test.com')
    })

    it('should update the password field when the user types', () => {
      render(<Login setToken={mockSetToken} />)
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      fireEvent.change(passwordInput, { target: { value: 'secret123' } })
      expect(passwordInput).toHaveValue('secret123')
    })
  })
})
