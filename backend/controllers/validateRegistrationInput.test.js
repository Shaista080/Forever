import { describe, it, expect } from '@jest/globals'
import { validateRegistrationInput } from './userController.js'

describe('validateRegistrationInput', () => {
  describe('email validation', () => {
    it('returns invalid for an email missing the @ symbol', () => {
      const result = validateRegistrationInput('notanemail', 'validpass123')
      expect(result).toEqual({
        valid: false,
        message: 'Please enter a valid email',
      })
    })

    it('returns invalid for an email missing a domain', () => {
      const result = validateRegistrationInput('user@', 'validpass123')
      expect(result).toEqual({
        valid: false,
        message: 'Please enter a valid email',
      })
    })

    it('returns invalid for an email missing a local part', () => {
      const result = validateRegistrationInput('@example.com', 'validpass123')
      expect(result).toEqual({
        valid: false,
        message: 'Please enter a valid email',
      })
    })

    it('accepts a valid email', () => {
      const result = validateRegistrationInput(
        'user@example.com',
        'validpass123'
      )
      expect(result).toEqual({ valid: true })
    })
  })

  describe('password validation', () => {
    it('returns invalid when password is 7 characters (one below the minimum)', () => {
      const result = validateRegistrationInput('user@example.com', '1234567')
      expect(result).toEqual({
        valid: false,
        message: 'Please enter a strong password',
      })
    })

    it('accepts a password that is exactly 8 characters (the minimum)', () => {
      const result = validateRegistrationInput('user@example.com', '12345678')
      expect(result).toEqual({ valid: true })
    })

    it('accepts a password longer than 8 characters', () => {
      const result = validateRegistrationInput(
        'user@example.com',
        'alongerpassword123'
      )
      expect(result).toEqual({ valid: true })
    })
  })

  it('validates email before password — when both are invalid, returns the email error', () => {
    const result = validateRegistrationInput('bademail', 'short')
    expect(result).toEqual({
      valid: false,
      message: 'Please enter a valid email',
    })
  })
})
