import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Contact from './Contact'
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

describe('Contact Page', () => {
  it('renders Contact section with title, image, store info, careers info, and Explore Jobs button', () => {
    render(<Contact />)
    expect(screen.getByTestId('title-CONTACT-US')).toBeInTheDocument()
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('src', assets.contact_img)
    expect(screen.getByText('Our Store')).toBeInTheDocument()
    expect(screen.getByText(/54709 Willms Station/i)).toBeInTheDocument()
    expect(screen.getByText(/Suite 350, Washington, USA/i)).toBeInTheDocument()
    expect(screen.getByText(/Tel: \(415\) 666-0132/i)).toBeInTheDocument()
    expect(screen.getByText(/Email: admin@forever\.com/i)).toBeInTheDocument()
    expect(screen.getByText('Careers at Forever')).toBeInTheDocument()
    expect(
      screen.getByText(/Learn more about our teams and job openings/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Explore Jobs/i })
    ).toBeInTheDocument()
  })

  it('renders NewsletterBox', () => {
    render(<Contact />)
    expect(screen.getByTestId('newsletter-box')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<Contact />)
    const markers = Array.from(
      container.querySelectorAll('[data-testid]')
    ).map((el) => el.getAttribute('data-testid'))
    expect(markers).toEqual(['title-CONTACT-US', 'newsletter-box'])
  })
})
