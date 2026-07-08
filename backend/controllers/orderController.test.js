import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────

const mockSave = jest.fn()
const MockOrderModel = jest.fn(() => ({ _id: 'order-1', save: mockSave }))

const MockUserModel = {
  findByIdAndUpdate: jest.fn(),
}

const mockSessionsCreate = jest.fn()

jest.unstable_mockModule('../models/orderModel.js', () => ({
  default: MockOrderModel,
}))

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: MockUserModel,
}))

// Stripe is instantiated at module load: `new Stripe(...)`. Mock the default
// export as a constructor returning an object with the checkout API we use.
jest.unstable_mockModule('stripe', () => ({
  default: jest.fn(() => ({
    checkout: { sessions: { create: mockSessionsCreate } },
  })),
}))

// ─── Dynamic imports ──────────────────────────────────────────────────────────

const { placeOrder, placeOrderStripe } = await import('./orderController.js')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() })

const orderBody = {
  userId: 'u1',
  items: [{ _id: 'p1', name: 'Shirt', price: 100, quantity: 2, size: 'M' }],
  amount: 210,
  address: { firstName: 'Alice', city: 'NYC' },
}

// ─── placeOrder (COD) ─────────────────────────────────────────────────────────

describe('placeOrder', () => {
  beforeEach(() => jest.clearAllMocks())

  it('saves the order as COD with payment false and the submitted fields', async () => {
    mockSave.mockResolvedValue()
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await placeOrder({ body: orderBody }, res)

    const savedData = MockOrderModel.mock.calls[0][0]
    expect(savedData).toMatchObject({
      userId: 'u1',
      items: orderBody.items,
      address: orderBody.address,
      amount: 210,
      paymentMethod: 'COD',
      payment: false,
    })
    expect(savedData.date).toBeDefined()
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it("clears the user's cart after saving", async () => {
    mockSave.mockResolvedValue()
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await placeOrder({ body: orderBody }, res)

    expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      cartData: {},
    })
  })

  it('returns success with Order Placed message', async () => {
    mockSave.mockResolvedValue()
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await placeOrder({ body: orderBody }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Order Placed',
    })
  })

  it('returns success: false with error message on failure', async () => {
    mockSave.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await placeOrder({ body: orderBody }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})

// ─── placeOrderStripe ─────────────────────────────────────────────────────────

describe('placeOrderStripe', () => {
  beforeEach(() => jest.clearAllMocks())

  const makeStripeReq = () => ({
    body: orderBody,
    headers: { origin: 'https://shop.test' },
  })

  it('saves the order as Stripe with payment false', async () => {
    mockSave.mockResolvedValue()
    mockSessionsCreate.mockResolvedValue({ url: 'https://stripe/session' })

    const res = makeRes()
    await placeOrderStripe(makeStripeReq(), res)

    const savedData = MockOrderModel.mock.calls[0][0]
    expect(savedData).toMatchObject({
      paymentMethod: 'Stripe',
      payment: false,
    })
  })

  it('builds line_items from items priced in cents plus a delivery charge line', async () => {
    mockSave.mockResolvedValue()
    mockSessionsCreate.mockResolvedValue({ url: 'https://stripe/session' })

    const res = makeRes()
    await placeOrderStripe(makeStripeReq(), res)

    const { line_items } = mockSessionsCreate.mock.calls[0][0]
    expect(line_items).toHaveLength(2)
    expect(line_items[0]).toMatchObject({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Shirt' },
        unit_amount: 10000, // 100 * 100
      },
      quantity: 2,
    })
    expect(line_items[1]).toMatchObject({
      price_data: {
        product_data: { name: 'Delivery Charges' },
        unit_amount: 1000, // 10 * 100
      },
      quantity: 1,
    })
  })

  it('creates a session with verify success/cancel URLs using the order id and origin', async () => {
    mockSave.mockResolvedValue()
    mockSessionsCreate.mockResolvedValue({ url: 'https://stripe/session' })

    const res = makeRes()
    await placeOrderStripe(makeStripeReq(), res)

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: 'https://shop.test/verify?success=true&orderId=order-1',
        cancel_url: 'https://shop.test/verify?success=false&orderId=order-1',
        mode: 'payment',
      })
    )
  })

  it('returns success with the stripe session url', async () => {
    mockSave.mockResolvedValue()
    mockSessionsCreate.mockResolvedValue({ url: 'https://stripe/session' })

    const res = makeRes()
    await placeOrderStripe(makeStripeReq(), res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      session_url: 'https://stripe/session',
    })
  })

  it('returns success: false with error message on failure', async () => {
    mockSave.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await placeOrderStripe(makeStripeReq(), res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})
