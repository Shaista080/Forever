import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Product from './Product'
import { ShopContext } from '../context/ShopContext'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ productId: 'p1' }),
}))

vi.mock('../components/RelatedProduct', () => ({
  default: ({ category, subCategory }) => (
    <div
      data-testid='related-product'
      data-category={category}
      data-subcategory={subCategory}
    >
      RelatedProduct
    </div>
  ),
}))

const mockProduct = {
  _id: 'p1',
  name: 'Test Shirt',
  price: 49,
  description: 'A great shirt',
  category: 'Men',
  subCategory: 'Topwear',
  image: ['img1.png', 'img2.png', 'img3.png'],
  sizes: ['S', 'M', 'L', 'XL'],
}

const mockAddToCart = vi.fn()

const renderProduct = (products = [mockProduct]) =>
  render(
    <ShopContext.Provider
      value={{ products, currency: '$', addToCart: mockAddToCart }}
    >
      <Product />
    </ShopContext.Provider>
  )

describe('Product Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering — product not found', () => {
    it('renders empty div when productId not in products list', () => {
      const { container } = renderProduct([])
      expect(container.firstChild).toHaveClass('opacity-0')
      expect(screen.queryByText('ADD TO CART')).not.toBeInTheDocument()
    })
  })

  describe('Rendering — product found', () => {
    it('renders product name, price, and description', () => {
      renderProduct()
      expect(screen.getByText('Test Shirt')).toBeInTheDocument()
      expect(screen.getByText('$49')).toBeInTheDocument()
      expect(screen.getByText('A great shirt')).toBeInTheDocument()
    })

    it('renders all thumbnail images', () => {
      const { container } = renderProduct()
      const thumbnails = Array.from(
        container.querySelectorAll('img.cursor-pointer')
      )
      expect(thumbnails).toHaveLength(3)
    })

    it('sets first thumbnail as main image on load', () => {
      const { container } = renderProduct()
      const mainImg = container.querySelector('img.h-auto')
      expect(mainImg).toHaveAttribute('src', 'img1.png')
    })

    it('renders all size buttons', () => {
      renderProduct()
      expect(screen.getByRole('button', { name: 'S' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'M' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'L' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'XL' })).toBeInTheDocument()
    })

    it('renders static policy lines', () => {
      renderProduct()
      expect(screen.getByText('100% Original Product.')).toBeInTheDocument()
      expect(
        screen.getByText(/Cash o delivery is available/i)
      ).toBeInTheDocument()
      expect(
        screen.getByText(/Easy return and exchange policy/i)
      ).toBeInTheDocument()
    })

    it('renders Description and Reviews tabs', () => {
      renderProduct()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Reviews (122)')).toBeInTheDocument()
    })

    it('renders RelatedProduct with correct category and subCategory', () => {
      renderProduct()
      const related = screen.getByTestId('related-product')
      expect(related).toHaveAttribute('data-category', 'Men')
      expect(related).toHaveAttribute('data-subcategory', 'Topwear')
    })
  })

  describe('Image interaction', () => {
    it('clicking a thumbnail updates the main displayed image', () => {
      const { container } = renderProduct()
      const img2Thumbnail = Array.from(
        container.querySelectorAll('img.cursor-pointer')
      ).find((img) => img.getAttribute('src') === 'img2.png')
      fireEvent.click(img2Thumbnail)
      const mainImg = container.querySelector('img.h-auto')
      expect(mainImg).toHaveAttribute('src', 'img2.png')
    })
  })

  describe('Size selection', () => {
    it('clicking a size button applies selected style', () => {
      renderProduct()
      const mButton = screen.getByRole('button', { name: 'M' })
      fireEvent.click(mButton)
      expect(mButton).toHaveClass('border-orange-500')
    })

    it('clicking a different size moves selected style', () => {
      renderProduct()
      const mButton = screen.getByRole('button', { name: 'M' })
      const lButton = screen.getByRole('button', { name: 'L' })
      fireEvent.click(mButton)
      fireEvent.click(lButton)
      expect(lButton).toHaveClass('border-orange-500')
      expect(mButton).not.toHaveClass('border-orange-500')
    })
  })

  describe('Add to cart', () => {
    it('calls addToCart with product id and selected size', () => {
      renderProduct()
      fireEvent.click(screen.getByRole('button', { name: 'M' }))
      fireEvent.click(screen.getByRole('button', { name: 'ADD TO CART' }))
      expect(mockAddToCart).toHaveBeenCalledWith('p1', 'M')
    })
  })
})
