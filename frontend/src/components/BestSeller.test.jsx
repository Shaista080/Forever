import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BestSeller from './BestSeller'
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
  bestSeller: false,
  ...overrides,
})

const renderWithProducts = (products) =>
  render(
    <ShopContext.Provider value={{ products }}>
      <BestSeller />
    </ShopContext.Provider>
  )

describe('BestSeller Component', () => {
  it('renders title and description', () => {
    renderWithProducts([])
    expect(screen.getByTestId('title')).toHaveTextContent('BEST SELLERS')
    expect(screen.getByText(/Lorem ipsum dolor sit amet/i)).toBeInTheDocument()
  })

  it('filters out non-bestsellers', () => {
    const products = [
      makeProduct(1, { bestSeller: true }),
      makeProduct(2, { bestSeller: false }),
      makeProduct(3, { bestSeller: true }),
      makeProduct(4, { bestSeller: false }),
    ]
    renderWithProducts(products)
    const items = screen.getAllByTestId('product-item')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveAttribute('data-id', 'id-1')
    expect(items[1]).toHaveAttribute('data-id', 'id-3')
  })

  it('renders all bestsellers when 5 or fewer', () => {
    const products = [
      makeProduct(1, { bestSeller: true }),
      makeProduct(2, { bestSeller: true }),
      makeProduct(3, { bestSeller: true }),
    ]
    renderWithProducts(products)
    expect(screen.getAllByTestId('product-item')).toHaveLength(3)
  })

  it('limits to 5 when more than 5 bestsellers', () => {
    const products = Array.from({ length: 8 }, (_, i) =>
      makeProduct(i, { bestSeller: true })
    )
    renderWithProducts(products)
    const items = screen.getAllByTestId('product-item')
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveAttribute('data-id', 'id-0')
    expect(items[4]).toHaveAttribute('data-id', 'id-4')
  })

  it('updates rendered products when context products change', () => {
    const initial = [makeProduct(1, { bestSeller: true })]
    const { rerender } = render(
      <ShopContext.Provider value={{ products: initial }}>
        <BestSeller />
      </ShopContext.Provider>
    )
    expect(screen.getAllByTestId('product-item')).toHaveLength(1)

    const updated = [
      makeProduct(10, { bestSeller: true }),
      makeProduct(11, { bestSeller: true }),
      makeProduct(12, { bestSeller: false }),
    ]
    rerender(
      <ShopContext.Provider value={{ products: updated }}>
        <BestSeller />
      </ShopContext.Provider>
    )
    const items = screen.getAllByTestId('product-item')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveAttribute('data-id', 'id-10')
  })

  it('renders nothing in grid when no bestsellers', () => {
    const products = [
      makeProduct(1, { bestSeller: false }),
      makeProduct(2, { bestSeller: false }),
    ]
    renderWithProducts(products)
    expect(screen.queryByTestId('product-item')).not.toBeInTheDocument()
  })
})
