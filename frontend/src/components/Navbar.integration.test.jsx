import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import Navbar from './Navbar'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid='location'>{loc.pathname}</div>
}

const NavigateBridge = ({ ctxOverrides = {}, children }) => {
  const navigate = useNavigate()
  const value = {
    setShowSearch: vi.fn(),
    getCartCount: vi.fn(() => 0),
    token: '',
    setToken: vi.fn(),
    setCartItems: vi.fn(),
    navigate,
    ...ctxOverrides,
  }
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

const renderNavbar = (ctxOverrides = {}, initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <NavigateBridge ctxOverrides={ctxOverrides}>
        <Navbar />
      </NavigateBridge>
      <Routes>
        <Route path='*' element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )

describe('Navbar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('clicking each desktop NavLink navigates to correct path', () => {
    const { container } = renderNavbar()
    const desktopNav = container.querySelector('ul')

    const paths = ['/collection', '/about', '/contact', '/']
    paths.forEach((path) => {
      const link = desktopNav.querySelector(`a[href="${path}"]`)
      fireEvent.click(link)
      expect(screen.getByTestId('location')).toHaveTextContent(path)
    })
  })

  it('clicking logo navigates to /', () => {
    const { container } = renderNavbar({}, '/about')
    expect(screen.getByTestId('location')).toHaveTextContent('/about')
    const logoLink = container.querySelectorAll('a[href="/"]')[0]
    fireEvent.click(logoLink)
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  it('clicking cart Link navigates to /cart', () => {
    const { container } = renderNavbar()
    const cartLink = container.querySelector('a[href="/cart"]')
    fireEvent.click(cartLink)
    expect(screen.getByTestId('location')).toHaveTextContent('/cart')
  })

  it('clicking profile icon navigates to /login when no token', () => {
    const { container } = renderNavbar({ token: '' })
    const profileIcon = container.querySelector(
      `img[src="${assets.profile_icon}"]`
    )
    fireEvent.click(profileIcon)
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('clicking Orders in dropdown navigates to /orders', () => {
    renderNavbar({ token: 'abc123' })
    fireEvent.click(screen.getByText('Orders'))
    expect(screen.getByTestId('location')).toHaveTextContent('/orders')
  })

  it('clicking Logout navigates to /login', () => {
    renderNavbar({ token: 'abc123' })
    fireEvent.click(screen.getByText('Logout'))
    expect(screen.getByTestId('location')).toHaveTextContent('/login')
  })

  it('clicking each mobile sidebar NavLink navigates to correct path', () => {
    const { container } = renderNavbar()
    fireEvent.click(container.querySelector(`img[src="${assets.menu_icon}"]`))
    const sidebar = container.querySelector('.absolute.top-0.right-0')

    const paths = ['/collection', '/about', '/contact', '/']
    paths.forEach((path) => {
      fireEvent.click(container.querySelector(`img[src="${assets.menu_icon}"]`))
      const link = sidebar.querySelector(`a[href="${path}"]`)
      fireEvent.click(link)
      expect(screen.getByTestId('location')).toHaveTextContent(path)
    })
  })
})
