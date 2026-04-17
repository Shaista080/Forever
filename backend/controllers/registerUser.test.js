import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────
// These must be declared BEFORE any dynamic import of the module under test.
// Because ES module imports are resolved at parse time (hoisted), we cannot
// use static imports for modules we want to mock — we must use dynamic imports
// AFTER registering the mocks here.

const mockSave = jest.fn()
const mockFindOne = jest.fn()
const MockUserModel = jest.fn().mockImplementation(() => ({ save: mockSave }))
MockUserModel.findOne = mockFindOne

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: MockUserModel,
}))

jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: jest.fn() },
}))

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn() },
}))

// ─── Dynamic imports (must come after mock registration) ──────────────────────
const { registerUser } = await import('./userController.js')
const { default: bcrypt } = await import('bcrypt')
const { default: jwt } = await import('jsonwebtoken')

// ─── Helper ───────────────────────────────────────────────────────────────────
// Builds fake req and res objects so we can call registerUser() directly
// without Express or HTTP being involved at all.
const makeReqRes = (body) => ({
  req: { body },
  res: { json: jest.fn() },
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('registerUser', () => {
  beforeEach(() => {
    // Reset all mocks between tests so one test's setup does not leak into the next
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  it('returns success: false for an invalid email format', async () => {
    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'notanemail',
      password: 'validpass123',
    })

    await registerUser(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please enter a valid email',
    })
    //does not query the database when validation fails
    expect(mockFindOne).not.toHaveBeenCalled()
  })

  it('returns success: false when the password is shorter than 8 characters', async () => {
    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short',
    })

    await registerUser(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Please enter a strong password',
    })
    //does not query the database when validation fails
    expect(mockFindOne).not.toHaveBeenCalled()
  })

  it('returns success: false when a user with that email already exists', async () => {
    mockFindOne.mockResolvedValue({ _id: 'existing-id' })

    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'validpass123',
    })

    await registerUser(req, res)

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'alice@example.com' })
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'User already exists',
    })
  })

  it('looks up the database using a lowercased version of the email', async () => {
    mockFindOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashedPassword')
    mockSave.mockResolvedValue({ _id: 'new-user-id' })
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'ALICE@EXAMPLE.COM',
      password: 'validpass123',
    })

    await registerUser(req, res)

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'alice@example.com' })
  })

  it('calls bcrypt.hash with the plaintext password and 10 salt rounds', async () => {
    mockFindOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashedPassword')
    mockSave.mockResolvedValue({ _id: 'new-user-id' })
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'validpass123',
    })

    await registerUser(req, res)

    expect(bcrypt.hash).toHaveBeenCalledWith('validpass123', 10)
  })

  it('saves the user with the correct name, lowercased email, and hashed password', async () => {
    mockFindOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashedPassword')
    mockSave.mockResolvedValue({ _id: 'new-user-id' })
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'ALICE@EXAMPLE.COM',
      password: 'validpass123',
    })

    await registerUser(req, res)

    // MockUserModel is the constructor — we check what it was called with
    // to confirm the right data is being written to the database
    expect(MockUserModel).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashedPassword',
    })
  })

  it('returns { success: false, message } when saving to the database fails', async () => {
    mockFindOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashedPassword')
    mockSave.mockRejectedValue(new Error('Database connection lost'))

    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'validpass123',
    })

    await registerUser(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database connection lost',
    })
  })

  it('returns { success: true, token } on valid input', async () => {
    mockFindOne.mockResolvedValue(null)
    bcrypt.hash.mockResolvedValue('hashedPassword')
    mockSave.mockResolvedValue({ _id: 'new-user-id' })
    jwt.sign.mockReturnValue('fake-token')

    const { req, res } = makeReqRes({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'validpass123',
    })

    await registerUser(req, res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      token: 'fake-token',
    })
  })
})
