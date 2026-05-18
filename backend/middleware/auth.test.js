import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────
// Must be declared BEFORE dynamic import of the module under test.

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: jest.fn() },
}))

// ─── Dynamic imports (must come after mock registration) ──────────────────────
const { default: authUser } = await import('./auth.js')
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
describe('authUser middleware tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = 'test-secret'
  })

  it('returns 401 and does not call next() when Authorization header is missing', async () => {
    const { req, res, next } = makeArgs()

    await authUser(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'NOT AUTHORIZED, LOGIN AGAIN!',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('calls next() and sets req.body.userId when token is valid', async () => {
    jwt.verify.mockReturnValue({ id: 'user-123' })

    const { req, res, next } = makeArgs('Bearer valid-token')

    await authUser(req, res, next)

    expect(jwt.verify).toHaveBeenCalledWith(
      'valid-token',
      process.env.JWT_SECRET
    )
    expect(req.body.userId).toBe('user-123')
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
    expect(res.json).not.toHaveBeenCalled()
  })

  it('returns 401 and does not call next() when token is invalid', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token')
    })

    const { req, res, next } = makeArgs('Bearer bad-token')

    await authUser(req, res, next)

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

    await authUser(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error! Not Authorized',
    })
    expect(next).not.toHaveBeenCalled()
  })
})
