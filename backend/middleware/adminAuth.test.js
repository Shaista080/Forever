import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────
// Must be declared BEFORE dynamic import of the module under test.

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: jest.fn() },
}))

// ─── Dynamic imports (must come after mock registration) ──────────────────────
const { default: adminAuth } = await import('./adminAuth.js')
const { default: jwt } = await import('jsonwebtoken')

// ─── Helper ───────────────────────────────────────────────────────────────────
const makeArgs = (authorizationHeader = undefined) => ({
  req: {
    headers: authorizationHeader ? { authorization: authorizationHeader } : {},
    body: {},
  },
  res: {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  },
  next: jest.fn(),
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('adminAuth middleware tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  it('returns 401 and does not call next() when Authorization header is missing', async () => {
    const { req, res, next } = makeArgs()

    await adminAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized! Login again.',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 and does not call next() when token is invalid', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    const { req, res, next } = makeArgs('Bearer bad-token')

    await adminAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error! Not Authorized',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 401 and does not call next() when token is expired', async () => {
    const expiredError = new Error('jwt expired')
    expiredError.name = 'TokenExpiredError'
    jwt.verify.mockImplementation(() => {
      throw expiredError
    })

    const { req, res, next } = makeArgs('Bearer expired-token')

    await adminAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error! Not Authorized',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() when token is valid and role is admin', async () => {
    jwt.verify.mockReturnValue({ role: 'admin' })

    const { req, res, next } = makeArgs('Bearer valid-admin-token')

    await adminAuth(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith(
      'valid-admin-token',
      process.env.JWT_SECRET
    )
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('returns 403 and does not call next() when token is valid but role is not admin', async () => {
    jwt.verify.mockReturnValue({ role: 'user' })

    const { req, res, next } = makeArgs('Bearer valid-user-token')

    await adminAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Not Authorized!',
    })
    expect(next).not.toHaveBeenCalled()
  })
})
