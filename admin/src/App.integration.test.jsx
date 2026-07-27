import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

// Only the network is faked — Navbar, SideBar, Login and the pages are REAL,
// so this exercises how the dashboard shell wires together.
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { response: { use: vi.fn(() => 1), eject: vi.fn() } },
  },
}))

vi.mock('react-toastify', () => ({
  ToastContainer: () => null,
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

const renderAppAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )

describe('Admin App Integration (dashboard shell)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    axios.get.mockResolvedValue({ data: { success: true, products } })
    axios.post.mockResolvedValue({ data: { success: true, orders: [] } })
  })

  afterEach(() => localStorage.clear())

  it('renders Navbar and SideBar together when logged in', () => {
    localStorage.setItem('token', 'tkn')
    renderAppAt('/add')

    // real Navbar
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
    // real SideBar links
    expect(screen.getByText('Add Items')).toBeInTheDocument()
    expect(screen.getByText('List Items')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    // real Add page mounted at /add
    expect(screen.getByText('Upload Image')).toBeInTheDocument()
  })

  it('navigates via the SideBar links and mounts the matching page', async () => {
    localStorage.setItem('token', 'tkn')
    renderAppAt('/add')

    // click the SideBar "List Items" link → route changes → List page renders
    fireEvent.click(screen.getByText('List Items'))

    expect(await screen.findByText('All Products Lists')).toBeInTheDocument()
    expect(await screen.findByText('Blue Shirt')).toBeInTheDocument()
  })

  it('logs out through the real Navbar and returns to the Login screen', async () => {
    localStorage.setItem('token', 'tkn')
    renderAppAt('/add')

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    // real Login component appears; dashboard shell gone
    expect(
      await screen.findByRole('heading', { name: /Admin Panel/i })
    ).toBeInTheDocument()
    expect(screen.queryByText('Add Items')).not.toBeInTheDocument()
  })

  it('shows the Login screen (no shell) when there is no token', () => {
    renderAppAt('/add')

    expect(
      screen.getByRole('heading', { name: /Admin Panel/i })
    ).toBeInTheDocument()
    expect(screen.queryByText('Add Items')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Logout' })
    ).not.toBeInTheDocument()
  })
})
