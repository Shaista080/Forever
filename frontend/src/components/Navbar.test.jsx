import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'

const renderNavbar = (ctxOverrides = {}) => {
  const ctx = {
    setShowSearch: vi.fn(),
    getCartCount: vi.fn(() => 0),
    navigate: vi.fn(),
    token: '',
    setToken: vi.fn(),
    setCartItems: vi.fn(),
    ...ctxOverrides,
  }
  const result = render(
    <MemoryRouter>
      <ShopContext.Provider value={ctx}>
        <Navbar />
      </ShopContext.Provider>
    </MemoryRouter>
  )
  return { ...result, ctx }
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders logo, 4 desktop nav links with correct paths, and search/profile/cart/menu icons', () => {
    const { container } = renderNavbar()

    const logoLink = container.querySelector('a[href="/"]')
    expect(logoLink).toBeInTheDocument()
    expect(logoLink.querySelector('img')).toHaveAttribute('src', assets.logo)

    const desktopNav = container.querySelector('ul')
    const desktopLinks = Array.from(desktopNav.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    )
    expect(desktopLinks).toEqual(['/', '/collection', '/about', '/contact'])
    expect(desktopNav).toHaveTextContent('HOME')
    expect(desktopNav).toHaveTextContent('COLLECTION')
    expect(desktopNav).toHaveTextContent('ABOUT')
    expect(desktopNav).toHaveTextContent('CONTACT')

    const imgSrcs = Array.from(container.querySelectorAll('img')).map((el) =>
      el.getAttribute('src')
    )
    expect(imgSrcs).toContain(assets.search_icon)
    expect(imgSrcs).toContain(assets.profile_icon)
    expect(imgSrcs).toContain(assets.cart_icon)
    expect(imgSrcs).toContain(assets.menu_icon)
  })

  it('clicking search icon calls setShowSearch(true)', () => {
    const { container, ctx } = renderNavbar()
    const searchIcon = container.querySelector(
      `img[src="${assets.search_icon}"]`
    )
    fireEvent.click(searchIcon)
    expect(ctx.setShowSearch).toHaveBeenCalledWith(true)
  })

  it('does not render profile dropdown when no token', () => {
    renderNavbar({ token: '' })
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument()
    expect(screen.queryByText('Orders')).not.toBeInTheDocument()
    expect(screen.queryByText('Logout')).not.toBeInTheDocument()
  })

  it('clicking profile icon does NOT navigate when token present', () => {
    const { container, ctx } = renderNavbar({ token: 'abc123' })
    const profileIcon = container.querySelector(
      `img[src="${assets.profile_icon}"]`
    )
    fireEvent.click(profileIcon)
    expect(ctx.navigate).not.toHaveBeenCalled()
  })

  it('renders profile dropdown (My Profile, Orders, Logout) when token present', () => {
    renderNavbar({ token: 'abc123' })
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('clicking Logout: navigates to /login, removes token from localStorage, clears token, clears cart', () => {
    localStorage.setItem('token', 'abc123')
    const { ctx } = renderNavbar({ token: 'abc123' })

    fireEvent.click(screen.getByText('Logout'))

    expect(ctx.navigate).toHaveBeenCalledWith('/login')
    expect(localStorage.getItem('token')).toBeNull()
    expect(ctx.setToken).toHaveBeenCalledWith('')
    expect(ctx.setCartItems).toHaveBeenCalledWith({})
  })

  it('cart link points to /cart and displays getCartCount value', () => {
    const { container } = renderNavbar({ getCartCount: vi.fn(() => 7) })
    const cartLink = container.querySelector('a[href="/cart"]')
    expect(cartLink).toBeInTheDocument()
    expect(cartLink.querySelector('img')).toHaveAttribute(
      'src',
      assets.cart_icon
    )
    expect(cartLink).toHaveTextContent('7')
  })

  it('clicking menu icon opens mobile sidebar', () => {
    const { container } = renderNavbar()
    const sidebar = container.querySelector('.absolute.top-0.right-0')
    expect(sidebar.className).toContain('w-0')

    const menuIcon = container.querySelector(`img[src="${assets.menu_icon}"]`)
    fireEvent.click(menuIcon)

    expect(sidebar.className).toContain('w-full')
  })

  it('mobile sidebar renders 4 nav links with correct paths', () => {
    const { container } = renderNavbar()
    const sidebar = container.querySelector('.absolute.top-0.right-0')
    const links = Array.from(sidebar.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    )
    expect(links).toEqual(['/', '/collection', '/about', '/contact'])

    expect(sidebar).toHaveTextContent('HOME')
    expect(sidebar).toHaveTextContent('COLLECTION')
    expect(sidebar).toHaveTextContent('ABOUT')
    expect(sidebar).toHaveTextContent('CONTACT')
  })

  it('clicking Back closes mobile sidebar', () => {
    const { container } = renderNavbar()
    fireEvent.click(container.querySelector(`img[src="${assets.menu_icon}"]`))
    const sidebar = container.querySelector('.absolute.top-0.right-0')
    expect(sidebar.className).toContain('w-full')

    fireEvent.click(screen.getByText('Back'))
    expect(sidebar.className).toContain('w-0')
  })

  it('clicking a sidebar nav link closes the sidebar', () => {
    const { container } = renderNavbar()
    fireEvent.click(container.querySelector(`img[src="${assets.menu_icon}"]`))
    const sidebar = container.querySelector('.absolute.top-0.right-0')
    expect(sidebar.className).toContain('w-full')

    const collectionLink = sidebar.querySelector('a[href="/collection"]')
    fireEvent.click(collectionLink)
    expect(sidebar.className).toContain('w-0')
  })
})
