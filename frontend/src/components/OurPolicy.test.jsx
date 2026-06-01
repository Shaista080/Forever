import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import OurPolicy from './OurPolicy'

describe('OurPolicy Component', () => {
  it('renders all 3 policy items with titles and descriptions', () => {
    render(<OurPolicy />)
    expect(screen.getByText(/Easy Exchange Policy/i)).toBeInTheDocument()
    expect(
      screen.getByText('We offer hassle free exchange policy.')
    ).toBeInTheDocument()

    expect(screen.getByText(/7 Days Return Policy/i)).toBeInTheDocument()
    expect(
      screen.getByText('We provide 7 days free return policy.')
    ).toBeInTheDocument()

    expect(screen.getByText('Best Customer Support')).toBeInTheDocument()
    expect(
      screen.getByText('We provide 24/7 customer support.')
    ).toBeInTheDocument()
  })

  it('renders 3 policy icons with non-empty src', () => {
    const { container } = render(<OurPolicy />)
    const imgs = container.querySelectorAll('img')
    expect(imgs).toHaveLength(3)
    imgs.forEach((img) => {
      expect(img.getAttribute('src')).toBeTruthy()
    })
  })
})
