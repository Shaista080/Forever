import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Navbar from './Navbar'

describe('Admin Navbar', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the logo and a Logout button', () => {
    const { container } = render(<Navbar setToken={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
    expect(container.querySelector('img')).toBeInTheDocument()
  })

  it('clears the token when Logout is clicked', () => {
    const setToken = vi.fn()
    render(<Navbar setToken={setToken} />)

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    expect(setToken).toHaveBeenCalledWith('')
  })
})
