import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CartTotal from './CartTotal'
import { ShopContext } from '../context/ShopContext'

vi.mock('./Title', () => ({
  default: ({ text1, text2 }) => (
    <div data-testid='title'>
      {text1} {text2}
    </div>
  ),
}))

const renderTotal = (getCartAmount) =>
  render(
    <ShopContext.Provider
      value={{ getCartAmount, currency: '$', delivery_fee: 10 }}
    >
      <CartTotal />
    </ShopContext.Provider>
  )

describe('CartTotal', () => {
  it('renders subtotal from getCartAmount and the shipping fee', () => {
    renderTotal(() => 200)
    expect(screen.getByText(/\$ 200\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$ 10\.00/)).toBeInTheDocument()
  })

  it('shows total as amount plus delivery fee when amount > 0', () => {
    renderTotal(() => 200)
    expect(screen.getByText(/\$ 210\.00/)).toBeInTheDocument()
  })

  it('shows total as 0 when amount is 0', () => {
    const { container } = renderTotal(() => 0)
    const total = container.querySelector('b:last-child')
    expect(total.textContent).toMatch(/\$\s*0\.00/)
  })
})
