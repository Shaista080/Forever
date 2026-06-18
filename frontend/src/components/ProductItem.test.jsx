import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

vi.mock('react-router-dom', () => ({
  Link: ({ to, children, className }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

const renderItem = (props) =>
  render(
    <ShopContext.Provider value={{ currency: '$' }}>
      <ProductItem {...props} />
    </ShopContext.Provider>
  )

describe('ProductItem Component', () => {
  const defaultProps = {
    id: 'p42',
    name: 'Cool Jacket',
    price: 89,
    image: ['jacket.png', 'jacket2.png'],
  }

  it('renders product name and price with currency symbol', () => {
    renderItem(defaultProps)
    expect(screen.getByText('Cool Jacket')).toBeInTheDocument()
    expect(screen.getByText('$89')).toBeInTheDocument()
  })

  it('link points to /product/:id', () => {
    renderItem(defaultProps)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/product/p42')
  })

  it('renders first image from image array', () => {
    const { container } = renderItem(defaultProps)
    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', 'jacket.png')
  })
})
