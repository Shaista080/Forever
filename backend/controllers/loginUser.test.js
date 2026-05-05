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
const { loginUser } = await import('./userController.js')
const { default: bcrypt } = await import('bcrypt')
const { default: jwt } = await import('jsonwebtoken')

// ─── Helper ───────────────────────────────────────────────────────────────────
const makeReqRes = (body) => ({
  req: { body },
  res: { json: jest.fn() },
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('loginUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  it('returns success: false when the user does not exist', async () => {
    mockFindOne.mockResolvedValue(null)

    const { req, res } = makeReqRes({
      email: 'nobody@example.com',
      password: 'Password123!',
    })

    await loginUser(req, res)

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'nobody@example.com' })
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User does not exists',
    })
    // Should not attempt password comparison if user not found
    expect(bcrypt.compare).not.toHaveBeenCalled()
  })

  it('returns success: false when the password does not match', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'user-id',
      password: 'hashedPassword',
    })
    bcrypt.compare.mockResolvedValue(false)

    const { req, res } = makeReqRes({
      email: 'alice@example.com',
      password: 'wrongPassword',
    })

    await loginUser(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid Credentials',
    })
  })

  it('calls bcrypt.compare with the plaintext password and the stored hash', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'user-id',
      password: 'storedHash',
    })
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      email: 'alice@example.com',
      password: 'Password123!',
    })

    await loginUser(req, res)

    expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', 'storedHash')
  })

  it('creates a token with the user ID on successful login', async () => {
    mockFindOne.mockResolvedValue({
      _id: 'user-id-123',
      password: 'hashedPassword',
    })
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      email: 'alice@example.com',
      password: 'Password123!',
    })

    await loginUser(req, res)

    expect(jwt.sign).toHaveBeenCalledWith({ id: 'user-id-123' }, 'test-secret')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: 'fake-token',
    })
  })

  it('returns success: false with the error message when an exception is thrown', async () => {
    mockFindOne.mockRejectedValue(new Error('Database connection lost'))

    const { req, res } = makeReqRes({
      email: 'alice@example.com',
      password: 'Password123!',
    })

    await loginUser(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database connection lost',
    })
  })
})
