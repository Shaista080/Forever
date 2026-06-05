import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SearchBar from './SearchBar'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'

const renderSearchBar = (ctxOverrides = {}, path = '/collection') => {
  const ctx = {
    search: '',
    setSearch: vi.fn(),
    showSearch: true,
    setShowSearch: vi.fn(),
    ...ctxOverrides,
  }
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <ShopContext.Provider value={ctx}>
        <SearchBar />
      </ShopContext.Provider>
    </MemoryRouter>
  )
  return { ...result, ctx }
}

describe('SearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders input and cross icon when showSearch=true AND on /collection', () => {
    const { container } = renderSearchBar({ showSearch: true }, '/collection')
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    expect(
      container.querySelector(`img[src="${assets.cross_icon}"]`)
    ).toBeInTheDocument()
  })

  it('does NOT render when showSearch=false on /collection', () => {
    renderSearchBar({ showSearch: false }, '/collection')
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument()
  })

  it('does NOT render when showSearch=true but on non-collection route', () => {
    renderSearchBar({ showSearch: true }, '/about')
    expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument()
  })

  it('displays current search value from context', () => {
    renderSearchBar({ search: 'shirt' }, '/collection')
    expect(screen.getByPlaceholderText('Search')).toHaveValue('shirt')
  })

  it('typing in input calls setSearch with value', () => {
    const { ctx } = renderSearchBar({}, '/collection')
    fireEvent.change(screen.getByPlaceholderText('Search'), {
      target: { value: 'jeans' },
    })
    expect(ctx.setSearch).toHaveBeenCalledWith('jeans')
  })

  it('clicking cross icon calls setShowSearch(false)', () => {
    const { container, ctx } = renderSearchBar({}, '/collection')
    fireEvent.click(container.querySelector(`img[src="${assets.cross_icon}"]`))
    expect(ctx.setShowSearch).toHaveBeenCalledWith(false)
  })
})
