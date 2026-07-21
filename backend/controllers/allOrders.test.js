import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────

const MockOrderModel = jest.fn()
MockOrderModel.find = jest.fn()

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

const { allOrders } = await import('./orderController.js')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() })

// ─── allOrders ────────────────────────────────────────────────────────────────

describe('allOrders', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns every order with success: true', async () => {
    const orders = [{ _id: 'o1' }, { _id: 'o2' }]
    MockOrderModel.find.mockResolvedValue(orders)

    const res = makeRes()
    await allOrders({}, res)

    expect(MockOrderModel.find).toHaveBeenCalledWith()
    expect(res.json).toHaveBeenCalledWith({ success: true, orders })
  })

  it('returns an empty list when there are no orders', async () => {
    MockOrderModel.find.mockResolvedValue([])

    const res = makeRes()
    await allOrders({}, res)

    expect(res.json).toHaveBeenCalledWith({ success: true, orders: [] })
  })

  it('returns success: false with error message on failure', async () => {
    MockOrderModel.find.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await allOrders({}, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})
