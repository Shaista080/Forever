import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import LatestCollection from './LatestCollection'
import { ShopContext } from '../context/ShopContext'

vi.mock('./Title', () => ({
  default: ({ text1, text2 }) => (
    <div data-testid='title'>
      {text1} {text2}
    </div>
  ),
}))

vi.mock('./ProductItem', () => ({
  default: ({ id, name, price }) => (
    <div data-testid='product-item' data-id={id}>
      {name} - {price}
    </div>
  ),
}))

const makeProduct = (i, overrides = {}) => ({
  _id: `id-${i}`,
  name: `Product ${i}`,
  price: 10 + i,
  image: [`img-${i}.png`],
  ...overrides,
})

const renderWithProducts = (products) =>
  render(
    <ShopContext.Provider value={{ products }}>
      <LatestCollection />
    </ShopContext.Provider>
  )

describe('LatestCollection Component', () => {
  it('renders title and description', () => {
    renderWithProducts([])
    expect(screen.getByTestId('title')).toHaveTextContent('LATEST COLLECTION')
    expect(screen.getByText(/Lorem ipsum dolor sit amet/i)).toBeInTheDocument()
  })

  it('renders all products from context when 10 or fewer', () => {
    const products = Array.from({ length: 6 }, (_, i) => makeProduct(i))
    renderWithProducts(products)
    expect(screen.getAllByTestId('product-item')).toHaveLength(6)
  })

  it('slices to 10 when context has more than 10 products', () => {
    const products = Array.from({ length: 15 }, (_, i) => makeProduct(i))
    renderWithProducts(products)
    const items = screen.getAllByTestId('product-item')
    expect(items).toHaveLength(10)
    expect(items[0]).toHaveAttribute('data-id', 'id-0')
    expect(items[9]).toHaveAttribute('data-id', 'id-9')
  })

  it('updates rendered products when context products change', () => {
    const initial = [makeProduct(1), makeProduct(2)]
    const { rerender } = render(
      <ShopContext.Provider value={{ products: initial }}>
        <LatestCollection />
      </ShopContext.Provider>
    )
    expect(screen.getAllByTestId('product-item')).toHaveLength(2)

    const updated = Array.from({ length: 4 }, (_, i) => makeProduct(i + 10))
    rerender(
      <ShopContext.Provider value={{ products: updated }}>
        <LatestCollection />
      </ShopContext.Provider>
    )
    const items = screen.getAllByTestId('product-item')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveAttribute('data-id', 'id-10')
  })

  it('renders nothing in grid when products empty', () => {
    renderWithProducts([])
    expect(screen.queryByTestId('product-item')).not.toBeInTheDocument()
  })
})
