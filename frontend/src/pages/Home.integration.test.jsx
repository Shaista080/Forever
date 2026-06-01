import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './Home'
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

const makeProducts = () => {
  const products = []
  for (let i = 1; i <= 10; i++) {
    products.push({
      _id: `latest-${i}`,
      name: `Latest Only ${i}`,
      price: 10 + i,
      image: [`l${i}.png`],
      bestSeller: false,
    })
  }
  for (let i = 1; i <= 2; i++) {
    products.push({
      _id: `best-${i}`,
      name: `Best Only ${i}`,
      price: 100 + i,
      image: [`b${i}.png`],
      bestSeller: true,
    })
  }
  return products
}

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <ShopContextProvider>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/product/:productId' element={<ProductPageStub />} />
        </Routes>
        <LocationProbe />
      </ShopContextProvider>
    </MemoryRouter>
  )

describe('Home Page Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders all sections with products fetched via real ShopContext', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: makeProducts() },
    })

    renderHome()

    // Hero
    expect(screen.getByText('OUR BESTSELLERS')).toBeInTheDocument()
    expect(screen.getByText('Latest Arrivals')).toBeInTheDocument()

    // Section titles (real Title component)
    expect(screen.getByText('COLLECTION')).toBeInTheDocument()
    expect(screen.getByText('SELLERS')).toBeInTheDocument()

    // OurPolicy
    expect(screen.getByText(/Easy Exchange Policy/i)).toBeInTheDocument()
    expect(screen.getByText(/7 Days Return Policy/i)).toBeInTheDocument()
    expect(screen.getByText(/Best Customer Support/i)).toBeInTheDocument()

    // NewsletterBox
    expect(screen.getByText('Subscribe now & get 20% off')).toBeInTheDocument()

    // Products from real fetch flow into real LatestCollection + BestSeller
    await waitFor(() => {
      expect(screen.getByText('Latest Only 1')).toBeInTheDocument()
    })
    expect(screen.getByText('Best Only 1')).toBeInTheDocument()
  })

  it('renders gracefully when products fetch fails', async () => {
    axios.get.mockResolvedValue({
      data: { success: false, message: 'Server error' },
    })
    const { toast } = await import('react-toastify')

    renderHome()

    // Static sections still render
    expect(screen.getByText('OUR BESTSELLERS')).toBeInTheDocument()
    expect(screen.getByText('COLLECTION')).toBeInTheDocument()
    expect(screen.getByText('SELLERS')).toBeInTheDocument()
    expect(screen.getByText('Subscribe now & get 20% off')).toBeInTheDocument()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error')
    })

    // No product cards rendered
    expect(screen.queryByText(/Latest Only/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Best Only/)).not.toBeInTheDocument()
  })

  it('clicking a product in LatestCollection navigates to its product page', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: makeProducts() },
    })

    renderHome()

    const productLink = await screen.findByText('Latest Only 3')
    fireEvent.click(productLink)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/product/latest-3'
      )
    })
    expect(screen.getByTestId('product-page')).toBeInTheDocument()
  })

  it('clicking a product in BestSeller navigates to its product page', async () => {
    axios.get.mockResolvedValue({
      data: { success: true, products: makeProducts() },
    })

    renderHome()

    const productLink = await screen.findByText('Best Only 1')
    fireEvent.click(productLink)

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/product/best-1'
      )
    })
    expect(screen.getByTestId('product-page')).toBeInTheDocument()
  })
})
