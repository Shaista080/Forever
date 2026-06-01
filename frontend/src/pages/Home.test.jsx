import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from './Home'

vi.mock('../components/Hero', () => ({
  default: () => <div data-testid='hero'>Hero</div>,
}))
vi.mock('../components/LatestCollection', () => ({
  default: () => <div data-testid='latest-collection'>LatestCollection</div>,
}))
vi.mock('../components/BestSeller', () => ({
  default: () => <div data-testid='best-seller'>BestSeller</div>,
}))
vi.mock('../components/OurPolicy', () => ({
  default: () => <div data-testid='our-policy'>OurPolicy</div>,
}))
vi.mock('../components/NewsletterBox', () => ({
  default: () => <div data-testid='newsletter-box'>NewsletterBox</div>,
}))

describe('Home Page', () => {
  it('renders all 5 sections', () => {
    render(<Home />)
    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('latest-collection')).toBeInTheDocument()
    expect(screen.getByTestId('best-seller')).toBeInTheDocument()
    expect(screen.getByTestId('our-policy')).toBeInTheDocument()
    expect(screen.getByTestId('newsletter-box')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<Home />)
    const testIds = Array.from(container.querySelectorAll('[data-testid]')).map(
      (el) => el.getAttribute('data-testid')
    )
    expect(testIds).toEqual([
      'hero',
      'latest-collection',
      'best-seller',
      'our-policy',
      'newsletter-box',
    ])
  })
})
