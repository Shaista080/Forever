import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import About from './About'

const renderAbout = () =>
  render(
    <MemoryRouter>
      <About />
    </MemoryRouter>
  )

describe('About Page Integration', () => {
  it('renders both section titles as real DOM text', () => {
    renderAbout()
    expect(screen.getByText('ABOUT')).toBeInTheDocument()
    expect(screen.getByText('US')).toBeInTheDocument()
    expect(screen.getByText('WHY')).toBeInTheDocument()
    expect(screen.getByText('CHOOSE US')).toBeInTheDocument()
  })

  it('renders real NewsletterBox with email input and subscribe button', () => {
    renderAbout()
    expect(screen.getByText('Subscribe now & get 20% off')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /SUBSCRIBE/i })
    ).toBeInTheDocument()
  })
})
