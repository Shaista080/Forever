import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Contact from './Contact'

const renderContact = () =>
  render(
    <MemoryRouter>
      <Contact />
    </MemoryRouter>
  )

describe('Contact Page Integration', () => {
  it('renders Title section as real DOM text', () => {
    renderContact()
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
    expect(screen.getByText('US')).toBeInTheDocument()
  })

  it('renders real NewsletterBox with email input and subscribe button', () => {
    renderContact()
    expect(screen.getByText('Subscribe now & get 20% off')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /SUBSCRIBE/i })
    ).toBeInTheDocument()
  })
})
