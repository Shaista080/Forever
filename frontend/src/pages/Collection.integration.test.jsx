import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import Collection from './Collection'
import ShopContextProvider from '../context/ShopContext'

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const LocationProbe = () => {
  const loc = useLocation()
  return <div data-testid='location'>{loc.pathname}</div>
}

const ProductPageStub = () => <div data-testid='product-page'>Product Page</div>

const makeProducts = () => [
  {
    _id: 'prod-1',
    name: 'Blue Shirt',
    price: 20,
    image: ['blue.png'],
    category: 'Men',
    subCategory: 'Topwear',
    bestSeller: false,
  },
  {
    _id: 'prod-2',
    name: 'Red Dress',
    price: 50,
    image: ['red.png'],
    category: 'Women',
    subCategory: 'Topwear',
    bestSeller: false,
  },
  {
    _id: 'prod-3',
    name: 'Kids Jacket',
    price: 35,
    image: ['jacket.png'],
    category: 'Kids',
    subCategory: 'Winterwear',
    bestSeller: false,
  },
]

const renderCollection = () =>
  render(
    <MemoryRouter initialEntries={['/collection']}>
      <ShopContextProvider>
        <Routes>
          <Route path='/collection' element={<Collection />} />
          <Route path='/product/:productId' element={<ProductPageStub />} />
        </Routes>
        <LocationProbe />
      </ShopContextProvider>
    </MemoryRouter>
  )

describe('Collection Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders products fetched via real ShopContext from mocked axios', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: makeProducts() },
    })

    renderCollection()

    await waitFor(() => {
      expect(screen.getByText('Blue Shirt')).toBeInTheDocument()
    })
    expect(screen.getByText('Red Dress')).toBeInTheDocument()
    expect(screen.getByText('Kids Jacket')).toBeInTheDocument()
  })

  it('renders empty grid when products fetch fails', async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: 'Server error' },
    })
    const { toast } = await import('react-toastify')

    renderCollection()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error')
    })

    expect(screen.queryByText('Blue Shirt')).not.toBeInTheDocument()
  })

  it('clicking a product navigates to its product page', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: makeProducts() },
    })

    renderCollection()

    const productLink = await screen.findByText('Blue Shirt')
    fireEvent.click(productLink)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/product/prod-1'
      )
    })
    expect(screen.getByTestId('product-page')).toBeInTheDocument()
  })
})
