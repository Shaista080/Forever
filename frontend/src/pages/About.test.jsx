import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import About from './About'
import { assets } from '../assets/assets'

vi.mock('../components/Title', () => ({
  default: ({ text1, text2 }) => (
    <div data-testid={`title-${text1}-${text2}`}>
      {text1} {text2}
    </div>
  ),
}))
vi.mock('../components/NewsletterBox', () => ({
  default: () => <div data-testid='newsletter-box'>NewsletterBox</div>,
}))

describe('About Page', () => {
  it('renders About section with title, image, and description', () => {
    render(<About />)
    expect(screen.getByTestId('title-ABOUT-US')).toBeInTheDocument()
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('src', assets.about_img)
    expect(screen.getByText(/Dolor quidem culpa sapiente/i)).toBeInTheDocument()
    expect(screen.getByText(/Soluta a doloremque vitae/i)).toBeInTheDocument()
    expect(screen.getByText('Our Mission')).toBeInTheDocument()
    expect(
      screen.getByText(/Suscipit eius officia fugit sequi/i)
    ).toBeInTheDocument()
  })

  it('renders Why Choose Us section with title and three feature boxes', () => {
    render(<About />)
    expect(screen.getByTestId('title-WHY-CHOOSE US')).toBeInTheDocument()
    expect(screen.getByText('Quality Assurance:')).toBeInTheDocument()
    expect(
      screen.getByText(/We meticulously select and vet each product/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Convenience:')).toBeInTheDocument()
    expect(
      screen.getByText(/With our user-friendly interface/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Exceptional Customer Service:')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Our team of dedicated professionals/i)
    ).toBeInTheDocument()
  })

  it('renders NewsletterBox', () => {
    render(<About />)
    expect(screen.getByTestId('newsletter-box')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<About />)
    const markers = Array.from(container.querySelectorAll('[data-testid]')).map(
      (el) => el.getAttribute('data-testid')
    )
    expect(markers).toEqual([
      'title-ABOUT-US',
      'title-WHY-CHOOSE US',
      'newsletter-box',
    ])
  })
})
