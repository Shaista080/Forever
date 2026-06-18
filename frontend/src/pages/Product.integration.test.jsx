import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import Product from './Product'
import { ShopContext } from '../context/ShopContext'

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid='location'>{loc.pathname}</div>
}

const makeProduct = (id, category = 'Men', subCategory = 'Topwear') => ({
  _id: id,
  name: `Product ${id}`,
  price: 50,
  description: 'Test description',
  category,
  subCategory,
  sizes: ['S', 'M', 'L'],
  image: [`${id}.png`],
})

const addToCart = vi.fn((_itemId, size) => {
  if (!size) toast.error('Select product size!')
})

// ShopContext.Provider with manual value instead of real ShopContextProvider:
// Product.jsx's useEffect depends only on [productId], not [products]. The real provider
// loads products async via axios — by the time they arrive, useEffect won't re-run and
// productData stays false. Pre-loaded manual value is the only way to render synchronously.
const renderProduct = (products, startPath = '/product/p1') =>
  render(
    <MemoryRouter initialEntries={[startPath]}>
      <ShopContext.Provider value={{ products, currency: '$', addToCart }}>
        <Routes>
          <Route path='/product/:productId' element={<Product />} />
        </Routes>
        <LocationProbe />
      </ShopContext.Provider>
    </MemoryRouter>
  )

describe('Product Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders RelatedProduct and ProductItem cards for matching products', () => {
    const products = [
      makeProduct('p1'),
      makeProduct('p2'),
      makeProduct('p3'),
      makeProduct('p4', 'Women', 'Topwear'),
    ]
    const { container } = renderProduct(products)

    expect(
      screen.getByRole('heading', { name: 'Product p1' })
    ).toBeInTheDocument()

    // p2 and p3 match Men/Topwear → appear as related links; p4 does not
    expect(container.querySelector('a[href="/product/p2"]')).toBeInTheDocument()
    expect(container.querySelector('a[href="/product/p3"]')).toBeInTheDocument()
    expect(
      container.querySelector('a[href="/product/p4"]')
    ).not.toBeInTheDocument()
  })

  it('clicking a related ProductItem navigates to that product route', async () => {
    const products = [makeProduct('p1'), makeProduct('p2')]
    renderProduct(products)

    fireEvent.click(screen.getByText('Product p2'))

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/product/p2')
    })
  })

  it('selecting a size and clicking ADD TO CART does not show size error', () => {
    renderProduct([makeProduct('p1')])

    fireEvent.click(screen.getByRole('button', { name: 'S' }))
    fireEvent.click(screen.getByRole('button', { name: 'ADD TO CART' }))

    expect(toast.error).not.toHaveBeenCalledWith('Select product size!')
  })

  it('clicking ADD TO CART without selecting a size shows error toast', () => {
    renderProduct([makeProduct('p1')])

    fireEvent.click(screen.getByRole('button', { name: 'ADD TO CART' }))

    expect(toast.error).toHaveBeenCalledWith('Select product size!')
  })
})
