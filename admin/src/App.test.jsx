import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// axios is used only for its interceptor wiring in App
vi.mock('axios', () => ({
  default: {
    interceptors: {
      response: { use: vi.fn(() => 1), eject: vi.fn() },
    },
  },
}))

vi.mock('react-toastify', () => ({
  ToastContainer: () => null,
  toast: { error: vi.fn() },
}))

// Stub children so the test targets App's own auth-gate / token logic.
vi.mock('./components/Login', () => ({
  default: ({ setToken }) => (
    <button onClick={() => setToken('new-token')}>do-login</button>
  ),
}))
vi.mock('./components/Navbar', () => ({
  default: ({ setToken }) => (
    <button onClick={() => setToken('')}>do-logout</button>
  ),
}))
vi.mock('./components/SideBar', () => ({
  default: () => <div data-testid='sidebar'>SideBar</div>,
}))
vi.mock('./pages/Add', () => ({ default: () => <div>Add</div> }))
vi.mock('./pages/List', () => ({ default: () => <div>List</div> }))
vi.mock('./pages/Order', () => ({ default: () => <div>Order</div> }))

const renderApp = () =>
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )

describe('Admin App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => localStorage.clear())

  it('shows the Login screen when there is no token', () => {
    renderApp()

    expect(screen.getByText('do-login')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('shows the dashboard (Navbar + SideBar) when a token exists', () => {
    localStorage.setItem('token', 'existing-token')
    renderApp()

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByText('do-logout')).toBeInTheDocument()
    expect(screen.queryByText('do-login')).not.toBeInTheDocument()
  })

  it('logs in, revealing the dashboard and persisting the token', async () => {
    renderApp()

    fireEvent.click(screen.getByText('do-login'))

    expect(await screen.findByTestId('sidebar')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('new-token')
  })

  it('logs out, returning to Login and clearing the stored token', async () => {
    localStorage.setItem('token', 'existing-token')
    renderApp()

    fireEvent.click(screen.getByText('do-logout'))

    expect(await screen.findByText('do-login')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('')
  })

  it('clears the token and toasts on a 401 response via the interceptor', async () => {
    localStorage.setItem('token', 'existing-token')
    renderApp()

    // App registered a response interceptor; grab its error handler
    const errorHandler = axios.interceptors.response.use.mock.calls[0][1]
    const { toast } = await import('react-toastify')

    await expect(
      errorHandler({ response: { status: 401 } })
    ).rejects.toBeDefined()

    expect(toast.error).toHaveBeenCalledWith(
      'Session expired. Please log in again.'
    )
    // token cleared → Login screen returns
    expect(await screen.findByText('do-login')).toBeInTheDocument()
  })
})
