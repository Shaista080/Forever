import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Hero from './Hero'

describe('Hero Component', () => {
  it('renders hero text content', () => {
    render(<Hero />)
    expect(screen.getByText('OUR BESTSELLERS')).toBeInTheDocument()
    expect(screen.getByText('Latest Arrivals')).toBeInTheDocument()
    expect(screen.getByText('SHOP NOW')).toBeInTheDocument()
  })

  it('renders hero image', () => {
    render(<Hero />)
    const img = document.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBeTruthy()
  })
})
