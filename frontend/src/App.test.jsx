import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

vi.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid='toast-container' />,
  toast: { error: vi.fn(), success: vi.fn() },
}))
vi.mock('./components/Navbar', () => ({
  default: () => <div data-testid='navbar' />,
}))
vi.mock('./components/SearchBar', () => ({
  default: () => <div data-testid='search-bar' />,
}))
vi.mock('./components/Footer', () => ({
  default: () => <div data-testid='footer' />,
}))
vi.mock('./pages/Home', () => ({
  default: () => <div data-testid='home' />,
}))
vi.mock('./pages/Collection', () => ({
  default: () => <div data-testid='collection' />,
}))
vi.mock('./pages/About', () => ({
  default: () => <div data-testid='about' />,
}))
vi.mock('./pages/Contact', () => ({
  default: () => <div data-testid='contact' />,
}))
vi.mock('./pages/Product', () => ({
  default: () => <div data-testid='product' />,
}))
vi.mock('./pages/Cart', () => ({
  default: () => <div data-testid='cart' />,
}))
vi.mock('./pages/Login', () => ({
  default: () => <div data-testid='login' />,
}))
vi.mock('./pages/PlaceOrder', () => ({
  default: () => <div data-testid='place-order' />,
}))
vi.mock('./pages/Orders', () => ({
  default: () => <div data-testid='orders' />,
}))
vi.mock('./pages/Verify', () => ({
  default: () => <div data-testid='verify' />,
}))

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )

describe('App', () => {
  it('renders persistent layout (Navbar, SearchBar, Footer, ToastContainer) on every route', () => {
    renderAt('/')
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('search-bar')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByTestId('toast-container')).toBeInTheDocument()
  })

  it('renders layout in correct order', () => {
    const { container } = renderAt('/')
    const order = Array.from(
      container.querySelectorAll('[data-testid]')
    ).map((el) => el.getAttribute('data-testid'))
    expect(order).toEqual([
      'toast-container',
      'navbar',
      'search-bar',
      'home',
      'footer',
    ])
  })

  it('routes each path to its page component', () => {
    const routes = [
      ['/', 'home'],
      ['/collection', 'collection'],
      ['/about', 'about'],
      ['/contact', 'contact'],
      ['/product/123', 'product'],
      ['/cart', 'cart'],
      ['/login', 'login'],
      ['/place-order', 'place-order'],
      ['/orders', 'orders'],
      ['/verify', 'verify'],
    ]

    routes.forEach(([path, testid]) => {
      const { unmount } = renderAt(path)
      expect(screen.getByTestId(testid)).toBeInTheDocument()
      unmount()
    })
  })
})
