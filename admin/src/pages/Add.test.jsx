import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Add from './Add'

vi.mock('../App', () => ({
  backendUrl: 'http://localhost:1001',
}))

vi.mock('axios')
vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

describe('Admin Add Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form fields and Add button', () => {
    render(<Add token='tkn' />)

    expect(screen.getByText('Upload Image')).toBeInTheDocument()
    expect(screen.getByText('Product name')).toBeInTheDocument()
    expect(screen.getByText('Product description')).toBeInTheDocument()
    expect(screen.getByText('Product category')).toBeInTheDocument()
    expect(screen.getByText('Sub category')).toBeInTheDocument()
    expect(screen.getByText('Product Price')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })

  it('renders all size options', () => {
    render(<Add token='tkn' />)
    ;['S', 'M', 'L', 'XL', 'XXL'].forEach((s) => {
      expect(screen.getByText(s)).toBeInTheDocument()
    })
  })

  it('updates the product name as the user types', () => {
    render(<Add token='tkn' />)
    const nameInput = screen.getByPlaceholderText('Type here')
    fireEvent.change(nameInput, { target: { value: 'Cool Shirt' } })
    expect(nameInput).toHaveValue('Cool Shirt')
  })

  it('updates the price as the user types', () => {
    render(<Add token='tkn' />)
    const priceInput = screen.getByPlaceholderText('25')
    fireEvent.change(priceInput, { target: { value: '49' } })
    expect(priceInput).toHaveValue(49)
  })

  it('toggles a size on and off when clicked', () => {
    render(<Add token='tkn' />)
    const sizeM = screen.getByText('M')

    expect(sizeM).toHaveClass('bg-slate-200')
    fireEvent.click(sizeM)
    expect(sizeM).toHaveClass('bg-pink-100')
    fireEvent.click(sizeM)
    expect(sizeM).toHaveClass('bg-slate-200')
  })

  it('toggles the bestseller checkbox', () => {
    render(<Add token='tkn' />)
    const checkbox = screen.getByRole('checkbox')

    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })
})
