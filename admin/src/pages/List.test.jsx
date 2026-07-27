import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import List from './List'

// Deterministic backendUrl/currency without loading the real App tree.
vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
  currency: '$',
}))

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

const products = [
  {
    _id: 'p1',
    name: 'Blue Shirt',
    category: 'Men',
    price: 49,
    image: ['blue.png'],
  },
  {
    _id: 'p2',
    name: 'Red Dress',
    category: 'Women',
    price: 79,
    image: ['red.png'],
  },
]

describe('Admin List Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axios.get.mockResolvedValue({ data: { success: true, products } })
  })

  it('renders the table header labels', async () => {
    render(<List token='tkn' />)
    await screen.findByText('Blue Shirt')

    expect(screen.getByText('All Products Lists')).toBeInTheDocument()
    expect(screen.getByText('Image')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('renders a row per fetched product with name, category and price', async () => {
    render(<List token='tkn' />)

    expect(await screen.findByText('Blue Shirt')).toBeInTheDocument()
    expect(screen.getByText('Red Dress')).toBeInTheDocument()
    expect(screen.getByText('Men')).toBeInTheDocument()
    expect(screen.getByText('Women')).toBeInTheDocument()
    expect(screen.getByText('$49')).toBeInTheDocument()
    expect(screen.getByText('$79')).toBeInTheDocument()
  })

  it('renders product images from image[0]', async () => {
    const { container } = render(<List token='tkn' />)
    await screen.findByText('Blue Shirt')

    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]).toHaveAttribute('src', 'blue.png')
  })

  it('renders an empty list (headers only) when there are no products', async () => {
    axios.get.mockResolvedValue({ data: { success: true, products: [] } })
    const { container } = render(<List token='tkn' />)
    await screen.findByText('All Products Lists')

    expect(container.querySelectorAll('img')).toHaveLength(0)
  })
})
