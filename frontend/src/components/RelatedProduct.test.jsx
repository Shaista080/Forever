import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RelatedProduct from './RelatedProduct'
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

const makeProduct = (i, category = 'Men', subCategory = 'Topwear') => ({
  _id: `id-${i}`,
  name: `Product ${i}`,
  price: 10 + i,
  image: [`img-${i}.png`],
  category,
  subCategory,
})

const renderRelated = (products, category = 'Men', subCategory = 'Topwear') =>
  render(
    <ShopContext.Provider value={{ products }}>
      <RelatedProduct category={category} subCategory={subCategory} />
    </ShopContext.Provider>
  )

describe('RelatedProduct Component', () => {
  it('renders Title with RELATED PRODUCTS', () => {
    renderRelated([])
    expect(screen.getByTestId('title')).toHaveTextContent('RELATED PRODUCTS')
  })

  it('renders only products matching both category and subCategory', () => {
    const products = [
      makeProduct(1, 'Men', 'Topwear'),
      makeProduct(2, 'Women', 'Topwear'),
      makeProduct(3, 'Men', 'Bottomwear'),
      makeProduct(4, 'Men', 'Topwear'),
    ]
    renderRelated(products, 'Men', 'Topwear')
    const items = screen.getAllByTestId('product-item')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveAttribute('data-id', 'id-1')
    expect(items[1]).toHaveAttribute('data-id', 'id-4')
  })

  it('renders nothing when no products match', () => {
    const products = [
      makeProduct(1, 'Women', 'Topwear'),
      makeProduct(2, 'Men', 'Bottomwear'),
    ]
    renderRelated(products, 'Men', 'Topwear')
    expect(screen.queryByTestId('product-item')).not.toBeInTheDocument()
  })

  it('renders all matches when 5 or fewer', () => {
    const products = Array.from({ length: 4 }, (_, i) => makeProduct(i))
    renderRelated(products)
    expect(screen.getAllByTestId('product-item')).toHaveLength(4)
  })

  it('limits to 5 when more than 5 match', () => {
    const products = Array.from({ length: 8 }, (_, i) => makeProduct(i))
    renderRelated(products)
    expect(screen.getAllByTestId('product-item')).toHaveLength(5)
  })

  it('updates rendered products when context products change', () => {
    const initial = [makeProduct(1)]
    const { rerender } = render(
      <ShopContext.Provider value={{ products: initial }}>
        <RelatedProduct category='Men' subCategory='Topwear' />
      </ShopContext.Provider>
    )
    expect(screen.getAllByTestId('product-item')).toHaveLength(1)

    const updated = Array.from({ length: 3 }, (_, i) => makeProduct(i + 10))
    rerender(
      <ShopContext.Provider value={{ products: updated }}>
        <RelatedProduct category='Men' subCategory='Topwear' />
      </ShopContext.Provider>
    )
    expect(screen.getAllByTestId('product-item')).toHaveLength(3)
  })
})
