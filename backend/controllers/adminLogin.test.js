import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────
// These must be declared BEFORE any dynamic import of the module under test.

const mockFindOne = jest.fn()
const MockUserModel = jest.fn()
MockUserModel.findOne = mockFindOne

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: MockUserModel,
}))

jest.unstable_mockModule('bcrypt', () => ({
  default: { compare: jest.fn() },
}))

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn() },
}))

// ─── Dynamic imports (must come after mock registration) ──────────────────────
const { adminLogin } = await import('./userController.js')
const { default: bcrypt } = await import('bcrypt')
const { default: jwt } = await import('jsonwebtoken')

// ─── Helper ───────────────────────────────────────────────────────────────────
const makeReqRes = (body) => ({
  req: { body },
  res: { json: jest.fn() },
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('adminLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  it('returns success: false when email is missing', async () => {
    const { req, res } = makeReqRes({ password: 'Password123!' })

    await adminLogin(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Credentials',
    })
    // Should short-circuit before touching the database
    expect(mockFindOne).not.toHaveBeenCalled()
  })

  it('returns success: false when password is missing', async () => {
    const { req, res } = makeReqRes({ email: 'admin@example.com' })

    await adminLogin(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Credentials',
    })
    expect(mockFindOne).not.toHaveBeenCalled()
  })

  it('queries for the user by lowercased email AND role admin', async () => {
    mockFindOne.mockResolvedValue(null)

    const { req, res } = makeReqRes({
      email: 'Admin@Example.COM',
      password: 'Password123!',
    })

    await adminLogin(req, res)

    expect(mockFindOne).toHaveBeenCalledWith({
      email: 'admin@example.com',
      role: 'admin',
    })
  })

  it('returns success: false when no matching admin exists', async () => {
    mockFindOne.mockResolvedValue(null)

    const { req, res } = makeReqRes({
      email: 'user@example.com',
      password: 'Password123!',
    })

    await adminLogin(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Credentials',
    })
    // Should not attempt password comparison if no admin found
    expect(bcrypt.compare).not.toHaveBeenCalled()
  })

  it('returns success: false when the password does not match', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'admin-id',
      password: 'hashedPassword',
      role: 'admin',
    })
    bcrypt.compare.mockResolvedValue(false)

    const { req, res } = makeReqRes({
      email: 'admin@example.com',
      password: 'wrongPassword',
    })

    await adminLogin(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Credentials',
    })
  })

  it('calls bcrypt.compare with the plaintext password and the stored hash', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'admin-id',
      password: 'storedHash',
      role: 'admin',
    })
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      email: 'admin@example.com',
      password: 'Password123!',
    })

    await adminLogin(req, res)

    expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'storedHash')
  })

  it('creates a token with the admin id and admin role on success', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'admin-id-123',
      password: 'hashedPassword',
      role: 'admin',
    })
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      email: 'admin@example.com',
      password: 'Password123!',
    })

    await adminLogin(req, res)

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'admin-id-123', role: 'admin' },
      'test-secret',
      { expiresIn: '3d' }
    )
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: 'fake-token',
    })
  })

  it('returns success: false with the error message when an exception is thrown', async () => {
    mockFindOne.mockRejectedValue(new Error('Database connection lost'))

    const { req, res } = makeReqRes({
      email: 'admin@example.com',
      password: 'Password123!',
    })

    await adminLogin(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database connection lost',
    })
  })
})
