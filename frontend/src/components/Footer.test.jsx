import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from './Footer'
import { assets } from '../assets/assets'

describe('Footer', () => {
  it('renders brand section with logo and description', () => {
    const { container } = render(<Footer />)
    const logo = container.querySelector('img')
    expect(logo).toHaveAttribute('src', assets.logo)
    expect(
      screen.getByText(/Lorem ipsum dolor sit amet consectetur/i)
    ).toBeInTheDocument()
  })

  it('renders COMPANY section with title and 4 items', () => {
    render(<Footer />)
    expect(screen.getByText('COMPANY')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('About Us')).toBeInTheDocument()
    expect(screen.getByText('Delivery')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
  })

  it('renders GET IN TOUCH section with title, phone, and email', () => {
    render(<Footer />)
    expect(screen.getByText('GET IN TOUCH')).toBeInTheDocument()
    expect(screen.getByText('+1-212-521-4569')).toBeInTheDocument()
    expect(screen.getByText('contact@foreveryou.com')).toBeInTheDocument()
  })

  it('renders copyright text', () => {
    render(<Footer />)
    expect(
      screen.getByText(/Copyright 2024@ forever\.com - All Right Reserved\./i)
    ).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<Footer />)
    const headings = Array.from(container.querySelectorAll('p')).map((p) =>
      p.textContent.trim()
    )
    const companyIdx = headings.indexOf('COMPANY')
    const contactIdx = headings.indexOf('GET IN TOUCH')
    const copyrightIdx = headings.findIndex((t) => t.startsWith('Copyright'))
    expect(companyIdx).toBeGreaterThan(-1)
    expect(contactIdx).toBeGreaterThan(companyIdx)
    expect(copyrightIdx).toBeGreaterThan(contactIdx)
  })
})
