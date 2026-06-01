import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import NewsletterBox from './NewsletterBox'

describe('NewsletterBox Component', () => {
  it('renders heading, copy, email input, and subscribe button', () => {
    render(<NewsletterBox />)
    expect(screen.getByText('Subscribe now & get 20% off')).toBeInTheDocument()
    expect(screen.getByText(/Lorem ipsum, dolor sit amet/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /SUBSCRIBE/i })
    ).toBeInTheDocument()
  })

  it('prevents default on form submit', () => {
    const { container } = render(<NewsletterBox />)
    const form = container.querySelector('form')

    const submitEvent = new Event('submit', {
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')

    form.dispatchEvent(submitEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
