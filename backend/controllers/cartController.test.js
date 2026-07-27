import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────

const MockUserModel = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}

jest.unstable_mockModule('../models/userModel.js', () => ({
  default: MockUserModel,
}))

// ─── Dynamic imports ──────────────────────────────────────────────────────────

const { addToCart, updateCart, getUserCart } =
  await import('./cartController.js')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() })

// ─── addToCart ──────────────────────────────────────────────────────────────

describe('addToCart', () => {
  beforeEach(() => jest.clearAllMocks())

  it('adds a new item with quantity 1 and persists', async () => {
    MockUserModel.findById.mockResolvedValue({ cartData: {} })
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await addToCart({ body: { userId: 'u1', itemId: 'p1', size: 'M' } }, res)

    expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      cartData: { p1: { M: 1 } },
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Added to cart',
    })
  })

  it('increments quantity when item and size already exist', async () => {
    MockUserModel.findById.mockResolvedValue({ cartData: { p1: { M: 2 } } })
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await addToCart({ body: { userId: 'u1', itemId: 'p1', size: 'M' } }, res)

    expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      cartData: { p1: { M: 3 } },
    })
  })

  it('adds a new size to an existing item', async () => {
    MockUserModel.findById.mockResolvedValue({ cartData: { p1: { M: 1 } } })
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await addToCart({ body: { userId: 'u1', itemId: 'p1', size: 'L' } }, res)

    expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      cartData: { p1: { M: 1, L: 1 } },
    })
  })

  it('returns success: false with error message on failure', async () => {
    MockUserModel.findById.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await addToCart({ body: { userId: 'u1', itemId: 'p1', size: 'M' } }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})

// ─── updateCart ───────────────────────────────────────────────────────────────

describe('updateCart', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets the quantity and persists', async () => {
    MockUserModel.findById.mockResolvedValue({ cartData: { p1: { M: 1 } } })
    MockUserModel.findByIdAndUpdate.mockResolvedValue()

    const res = makeRes()
    await updateCart(
      { body: { userId: 'u1', itemId: 'p1', size: 'M', quantity: 5 } },
      res
    )

    expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('u1', {
      cartData: { p1: { M: 5 } },
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Cart updated',
    })
  })

  it('returns success: false with error message on failure', async () => {
    MockUserModel.findById.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await updateCart(
      { body: { userId: 'u1', itemId: 'p1', size: 'M', quantity: 5 } },
      res
    )

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})

// ─── getUserCart ──────────────────────────────────────────────────────────────

describe('getUserCart', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the cartData with success: true', async () => {
    MockUserModel.findById.mockResolvedValue({ cartData: { p1: { M: 2 } } })

    const res = makeRes()
    await getUserCart({ body: { userId: 'u1' } }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      cartData: { p1: { M: 2 } },
    })
  })

  it('returns success: false with error message on failure', async () => {
    MockUserModel.findById.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await getUserCart({ body: { userId: 'u1' } }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})
