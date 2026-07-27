import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────

const MockOrderModel = jest.fn()
MockOrderModel.findByIdAndUpdate = jest.fn()
MockOrderModel.findByIdAndDelete = jest.fn()

const MockUserModel = { findByIdAndUpdate: jest.fn() }

jest.unstable_mockModule('../models/orderModel.js', () => ({
  default: MockOrderModel,
}))

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: MockUserModel,
}))

// orderController instantiates `new Stripe(...)` at module load
jest.unstable_mockModule('stripe', () => ({
  default: jest.fn(() => ({ checkout: { sessions: { create: jest.fn() } } })),
}))

// ─── Dynamic imports ──────────────────────────────────────────────────────────

const { verifyStripe } = await import('./orderController.js')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() })

// ─── verifyStripe ─────────────────────────────────────────────────────────────

describe('verifyStripe', () => {
  beforeEach(() => jest.clearAllMocks())

  it('marks order paid and clears cart when success === "true"', async () => {
    MockOrderModel.findByIdAndUpdate.mockResolvedValue()
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await verifyStripe(
      { body: { orderId: 'o1', success: 'true', userId: 'u1' } },
      res
    )

    expect(MockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith('o1', {
      payment: true,
    })
    expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      cartData: {},
    })
    expect(MockOrderModel.findByIdAndDelete).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('deletes the order when success is not "true"', async () => {
    MockOrderModel.findByIdAndDelete.mockResolvedValue()

    const res = makeRes()
    await verifyStripe(
      { body: { orderId: 'o1', success: 'false', userId: 'u1' } },
      res
    )

    expect(MockOrderModel.findByIdAndDelete).toHaveBeenCalledWith('o1')
    expect(MockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
    expect(MockUserModel.findByIdAndUpdate).not.toHaveBeenCalled()
    expect(res.json).toHaveBeenCalledWith({ success: false })
  })

  it('returns success: false with error message on failure', async () => {
    MockOrderModel.findByIdAndUpdate.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await verifyStripe(
      { body: { orderId: 'o1', success: 'true', userId: 'u1' } },
      res
    )

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})
