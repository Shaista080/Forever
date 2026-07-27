import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Cart from './Cart'
import { ShopContext } from '../context/ShopContext'

vi.mock('../components/CartTotal', () => ({
  default: () => <div data-testid='cart-total'>CartTotal</div>,
}))

vi.mock('../components/Title', () => ({
  default: ({ text1, text2 }) => (
    <div data-testid='title'>
      {text1} {text2}
    </div>
  ),
}))

const products = [
  {
    _id: 'p1',
    name: 'Shirt',
    price: 100,
    image: ['shirt.png'],
  },
  {
    _id: 'p2',
    name: 'Pants',
    price: 50,
    image: ['pants.png'],
  },
]

const mockUpdateQuantity = vi.fn()
const mockNavigate = vi.fn()

const renderCart = (cartItems = {}) =>
  render(
    <ShopContext.Provider
      value={{
        products,
        currency: '$',
        cartItems,
        updateQuantity: mockUpdateQuantity,
        navigate: mockNavigate,
      }}
    >
      <Cart />
    </ShopContext.Provider>
  )

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Cart Page', () => {
  it('renders one row per cart entry with quantity greater than 0', () => {
    const { container } = renderCart({ p1: { M: 2 }, p2: { L: 1 } })
    // Each row is the grid div with a quantity input.
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(2)
  })

  it('skips entries with quantity 0', () => {
    const { container } = renderCart({ p1: { M: 0 }, p2: { L: 1 } })
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(1)
    expect(screen.getByText('Pants')).toBeInTheDocument()
    expect(screen.queryByText('Shirt')).not.toBeInTheDocument()
  })

  it('renders product name, price, size, and image for a row', () => {
    const { container } = renderCart({ p1: { M: 2 } })
    expect(screen.getByText('Shirt')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('M', { selector: 'p' })).toBeInTheDocument()
    const img = container.querySelector('img[src="shirt.png"]')
    expect(img).toBeInTheDocument()
  })

  it('renders no rows for an empty cart', () => {
    const { container } = renderCart({})
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0)
  })

  it('calls updateQuantity with numeric value on quantity change', () => {
    renderCart({ p1: { M: 2 } })
    const input = screen.getByDisplayValue('2')
    fireEvent.change(input, { target: { value: '5' } })
    expect(mockUpdateQuantity).toHaveBeenCalledWith('p1', 'M', 5)
  })

  it('ignores empty string and "0" quantity input', () => {
    renderCart({ p1: { M: 2 } })
    const input = screen.getByDisplayValue('2')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.change(input, { target: { value: '0' } })
    expect(mockUpdateQuantity).not.toHaveBeenCalled()
  })

  it('calls updateQuantity with 0 when bin icon clicked', () => {
    const { container } = renderCart({ p1: { M: 2 } })
    // The bin icon is the clickable image in the row.
    const bin = container.querySelector('img.cursor-pointer')
    fireEvent.click(bin)
    expect(mockUpdateQuantity).toHaveBeenCalledWith('p1', 'M', 0)
  })

  it('navigates to place-order on checkout click', () => {
    renderCart({ p1: { M: 2 } })
    fireEvent.click(screen.getByRole('button', { name: 'PROCEED TO CHECKOUT' }))
    expect(mockNavigate).toHaveBeenCalledWith('/place-order')
  })
})
