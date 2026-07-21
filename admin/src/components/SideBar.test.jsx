import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SideBar from './SideBar'

const renderSideBar = () =>
  render(
    <MemoryRouter>
      <SideBar />
    </MemoryRouter>
  )

describe('Admin SideBar', () => {
  it('renders the three navigation labels', () => {
    renderSideBar()

    expect(screen.getByText('Add Items')).toBeInTheDocument()
    expect(screen.getByText('List Items')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
  })

  it('links each item to its route', () => {
    renderSideBar()

    expect(screen.getByText('Add Items').closest('a')).toHaveAttribute(
      'href',
      '/add'
    )
    expect(screen.getByText('List Items').closest('a')).toHaveAttribute(
      'href',
      '/list'
    )
    expect(screen.getByText('Orders').closest('a')).toHaveAttribute(
      'href',
      '/order'
    )
  })
})
