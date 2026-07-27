import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────

const MockOrderModel = jest.fn()
MockOrderModel.findByIdAndUpdate = jest.fn()

jest.unstable_mockModule('../models/orderModel.js', () => ({
  default: MockOrderModel,
}))

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: { findByIdAndUpdate: jest.fn() },
}))

// orderController instantiates `new Stripe(...)` at module load
jest.unstable_mockModule('stripe', () => ({
  default: jest.fn(() => ({ checkout: { sessions: { create: jest.fn() } } })),
}))

// ─── Dynamic imports ──────────────────────────────────────────────────────────

const { updateStatus } = await import('./orderController.js')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() })

// ─── updateStatus ─────────────────────────────────────────────────────────────

describe('updateStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('updates the order status and returns success', async () => {
    MockOrderModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await updateStatus({ body: { orderId: 'o1', status: 'Shipped' } }, res)

    expect(MockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith('o1', {
      status: 'Shipped',
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Status updated',
    })
  })

  it('returns success: false with error message on failure', async () => {
    MockOrderModel.findByIdAndUpdate.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await updateStatus({ body: { orderId: 'o1', status: 'Shipped' } }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})
