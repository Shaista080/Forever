import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Collection from './Collection'
import { ShopContext } from '../context/ShopContext'

vi.mock('../components/Title', () => ({
  default: ({ text1, text2 }) => (
    <div data-testid='title'>
      {text1} {text2}
    </div>
  ),
}))

vi.mock('../components/ProductItem', () => ({
  default: ({ id, name, price }) => (
    <div data-testid='product-item' data-id={id}>
      {name} - {price}
    </div>
  ),
}))


const makeProduct = (id, overrides = {}) => ({
  _id: `id-${id}`,
  name: `Product ${id}`,
  price: id * 10,
  image: [`img-${id}.png`],
  category: 'Men',
  subCategory: 'Topwear',
  ...overrides,
})

const renderCollection = (ctxOverrides = {}) => {
  const ctx = {
    products: [],
    search: '',
    showSearch: false,
    ...ctxOverrides,
  }
  return render(
    <ShopContext.Provider value={ctx}>
      <Collection />
    </ShopContext.Provider>
  )
}

describe('Collection Page', () => {
  describe('Rendering', () => {
    it('renders title, sort dropdown, and FILTERS toggle', () => {
      renderCollection()
      expect(screen.getByTestId('title')).toHaveTextContent('ALL COLLECTIONS')
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('FILTERS')).toBeInTheDocument()
    })

    it('renders category, type, and sort option labels', () => {
      renderCollection({ products: [] })
      expect(screen.getByText('Sort by: Relevant')).toBeInTheDocument()
      expect(screen.getByText('Sort by: Low to High')).toBeInTheDocument()
      expect(screen.getByText('Sort by: High to Low')).toBeInTheDocument()
      expect(screen.getByText('Men')).toBeInTheDocument()
      expect(screen.getByText('Women')).toBeInTheDocument()
      expect(screen.getByText('Kids')).toBeInTheDocument()
      expect(screen.getByText('Topwear')).toBeInTheDocument()
      expect(screen.getByText('Bottomwear')).toBeInTheDocument()
      expect(screen.getByText('Winterwear')).toBeInTheDocument()
    })

    it('renders all products when no filters active', () => {
      const products = [
        makeProduct(1),
        makeProduct(2),
        makeProduct(3),
      ]
      renderCollection({ products })
      expect(screen.getAllByTestId('product-item')).toHaveLength(3)
    })

    it('renders empty grid when products is empty', () => {
      renderCollection({ products: [] })
      expect(screen.queryByTestId('product-item')).not.toBeInTheDocument()
    })

    it('no category or type checkboxes are checked by default', () => {
      renderCollection({ products: [makeProduct(1)] })
      const checkboxes = screen.getAllByRole('checkbox')
      checkboxes.forEach((cb) => expect(cb).not.toBeChecked())
    })

    it('sort dropdown defaults to relevant', () => {
      renderCollection()
      expect(screen.getByRole('combobox')).toHaveValue('relevant')
    })
  })

  describe('Category filter', () => {
    const products = [
      makeProduct(1, { category: 'Men' }),
      makeProduct(2, { category: 'Women' }),
      makeProduct(3, { category: 'Kids' }),
    ]

    it('checking one category shows only matching products', () => {
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Men'))
      const items = screen.getAllByTestId('product-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveAttribute('data-id', 'id-1')
    })

    it('checking two categories shows products from both', () => {
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Men'))
      fireEvent.click(screen.getByDisplayValue('Women'))
      expect(screen.getAllByTestId('product-item')).toHaveLength(2)
    })

    it('unchecking a category restores products', () => {
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Men'))
      expect(screen.getAllByTestId('product-item')).toHaveLength(1)
      fireEvent.click(screen.getByDisplayValue('Men'))
      expect(screen.getAllByTestId('product-item')).toHaveLength(3)
    })
  })

  describe('Type filter', () => {
    const products = [
      makeProduct(1, { subCategory: 'Topwear' }),
      makeProduct(2, { subCategory: 'Bottomwear' }),
      makeProduct(3, { subCategory: 'Winterwear' }),
    ]

    it('checking one type shows only matching products', () => {
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Topwear'))
      const items = screen.getAllByTestId('product-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveAttribute('data-id', 'id-1')
    })

    it('checking two types shows products from both', () => {
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Topwear'))
      fireEvent.click(screen.getByDisplayValue('Bottomwear'))
      expect(screen.getAllByTestId('product-item')).toHaveLength(2)
    })

    it('unchecking a type restores products', () => {
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Topwear'))
      expect(screen.getAllByTestId('product-item')).toHaveLength(1)
      fireEvent.click(screen.getByDisplayValue('Topwear'))
      expect(screen.getAllByTestId('product-item')).toHaveLength(3)
    })
  })

  describe('Category + Type combined', () => {
    it('both filters applied together narrows results correctly', () => {
      const products = [
        makeProduct(1, { category: 'Men', subCategory: 'Topwear' }),
        makeProduct(2, { category: 'Men', subCategory: 'Bottomwear' }),
        makeProduct(3, { category: 'Women', subCategory: 'Topwear' }),
      ]
      renderCollection({ products })
      fireEvent.click(screen.getByDisplayValue('Men'))
      fireEvent.click(screen.getByDisplayValue('Topwear'))
      const items = screen.getAllByTestId('product-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveAttribute('data-id', 'id-1')
    })
  })

  describe('Search integration', () => {
    const products = [
      makeProduct(1, { name: 'Blue Shirt' }),
      makeProduct(2, { name: 'Red Pants' }),
    ]

    it('filters grid by search when showSearch=true', () => {
      renderCollection({ products, search: 'shirt', showSearch: true })
      const items = screen.getAllByTestId('product-item')
      expect(items).toHaveLength(1)
      expect(items[0]).toHaveAttribute('data-id', 'id-1')
    })

    it('ignores search value when showSearch=false', () => {
      renderCollection({ products, search: 'shirt', showSearch: false })
      expect(screen.getAllByTestId('product-item')).toHaveLength(2)
    })
  })

  describe('Sort', () => {
    const products = [
      makeProduct(3, { price: 30 }),
      makeProduct(1, { price: 10 }),
      makeProduct(2, { price: 20 }),
    ]

    it('sort low-high orders grid by ascending price', () => {
      renderCollection({ products })
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'low-high' },
      })
      const items = screen.getAllByTestId('product-item')
      expect(items[0]).toHaveAttribute('data-id', 'id-1')
      expect(items[1]).toHaveAttribute('data-id', 'id-2')
      expect(items[2]).toHaveAttribute('data-id', 'id-3')
    })

    it('sort high-low orders grid by descending price', () => {
      renderCollection({ products })
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'high-low' },
      })
      const items = screen.getAllByTestId('product-item')
      expect(items[0]).toHaveAttribute('data-id', 'id-3')
      expect(items[1]).toHaveAttribute('data-id', 'id-2')
      expect(items[2]).toHaveAttribute('data-id', 'id-1')
    })

    it('sort relevant resets to original filter order', () => {
      renderCollection({ products })
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'low-high' },
      })
      fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'relevant' },
      })
      const items = screen.getAllByTestId('product-item')
      expect(items[0]).toHaveAttribute('data-id', 'id-3')
      expect(items[1]).toHaveAttribute('data-id', 'id-1')
      expect(items[2]).toHaveAttribute('data-id', 'id-2')
    })
  })

  describe('Filter panel toggle', () => {
    it('filter panels have hidden class by default', () => {
      const { container } = renderCollection({ products: [] })
      const panels = container.querySelectorAll('.hidden')
      expect(panels.length).toBeGreaterThan(0)
    })

    it('clicking FILTERS shows category and type filter options', () => {
      const { container } = renderCollection({ products: [] })
      fireEvent.click(screen.getByText('FILTERS'))
      expect(container.querySelectorAll('.hidden')).toHaveLength(0)
      expect(screen.getByText('CATEGORIES')).toBeInTheDocument()
      expect(screen.getByText('TYPE')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Men')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Topwear')).toBeInTheDocument()
    })
  })
})
