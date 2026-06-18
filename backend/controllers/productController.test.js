import { jest, describe, it, expect, beforeEach } from '@jest/globals'

// ─── Mock setup ───────────────────────────────────────────────────────────────

const mockSave = jest.fn()
const MockProductModel = jest.fn(() => ({ save: mockSave }))
MockProductModel.find = jest.fn()
MockProductModel.findById = jest.fn()
MockProductModel.findByIdAndDelete = jest.fn()
MockProductModel.insertMany = jest.fn()

jest.unstable_mockModule('../models/productModel.js', () => ({
  default: MockProductModel,
}))

jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    uploader: { upload: jest.fn() },
  },
}))

// ─── Dynamic imports ──────────────────────────────────────────────────────────

const {
  addProduct,
  listProduct,
  removeProduct,
  singleProduct,
  addProductsBulk,
} = await import('./productController.js')
const { v2: cloudinary } = await import('cloudinary')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => ({ json: jest.fn(), status: jest.fn().mockReturnThis() })

const makeAddReq = (overrides = {}) => ({
  body: {
    name: 'Test Shirt',
    description: 'A shirt',
    price: '49',
    category: 'Men',
    subCategory: 'Topwear',
    sizes: JSON.stringify(['S', 'M', 'L']),
    bestSeller: 'false',
    ...overrides,
  },
  files: {
    image1: [{ path: '/tmp/img1.jpg' }],
    image2: [{ path: '/tmp/img2.jpg' }],
  },
})

// ─── addProduct ───────────────────────────────────────────────────────────────

describe('addProduct', () => {
  beforeEach(() => jest.clearAllMocks())

  it('uploads provided images to cloudinary and saves product', async () => {
    cloudinary.uploader.upload
      .mockResolvedValueOnce({ secure_url: 'https://cdn/img1.jpg' })
      .mockResolvedValueOnce({ secure_url: 'https://cdn/img2.jpg' })
    mockSave.mockResolvedValue()

    const res = makeRes()
    await addProduct(makeAddReq(), res)

    expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(2)
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Product Added',
    })
  })

  it('coerces price to Number', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    mockSave.mockResolvedValue()

    const res = makeRes()
    await addProduct(makeAddReq({ price: '99' }), res)

    const savedData = MockProductModel.mock.calls[0][0]
    expect(savedData.price).toBe(99)
    expect(typeof savedData.price).toBe('number')
  })

  it('coerces bestSeller string "true" to boolean true', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    mockSave.mockResolvedValue()

    const res = makeRes()
    await addProduct(makeAddReq({ bestSeller: 'true' }), res)

    const savedData = MockProductModel.mock.calls[0][0]
    expect(savedData.bestSeller).toBe(true)
  })

  it('parses sizes from JSON string', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    mockSave.mockResolvedValue()

    const res = makeRes()
    await addProduct(makeAddReq({ sizes: JSON.stringify(['XS', 'XL']) }), res)

    const savedData = MockProductModel.mock.calls[0][0]
    expect(savedData.sizes).toEqual(['XS', 'XL'])
  })

  it('returns success: false with error message on failure', async () => {
    cloudinary.uploader.upload.mockRejectedValue(
      new Error('Cloudinary unavailable')
    )

    const res = makeRes()
    await addProduct(makeAddReq(), res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Cloudinary unavailable',
    })
  })
})

// ─── listProduct ──────────────────────────────────────────────────────────────

describe('listProduct', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns all products with success: true', async () => {
    const products = [{ _id: 'p1', name: 'Shirt' }]
    MockProductModel.find.mockResolvedValue(products)

    const res = makeRes()
    await listProduct({}, res)

    expect(MockProductModel.find).toHaveBeenCalledWith({})
    expect(res.json).toHaveBeenCalledWith({ success: true, products })
  })

  it('returns success: false with error message on failure', async () => {
    MockProductModel.find.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await listProduct({}, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})

// ─── removeProduct ────────────────────────────────────────────────────────────

describe('removeProduct', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls findByIdAndDelete with req.body.id and returns success', async () => {
    MockProductModel.findByIdAndDelete.mockResolvedValue()

    const res = makeRes()
    await removeProduct({ body: { id: 'p42' } }, res)

    expect(MockProductModel.findByIdAndDelete).toHaveBeenCalledWith('p42')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Product Removed',
    })
  })

  it('returns success: false with error message on failure', async () => {
    MockProductModel.findByIdAndDelete.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await removeProduct({ body: { id: 'bad-id' } }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})

// ─── singleProduct ────────────────────────────────────────────────────────────

describe('singleProduct', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns product by id with success: true', async () => {
    const product = { _id: 'p1', name: 'Shirt' }
    MockProductModel.findById.mockResolvedValue(product)

    const res = makeRes()
    await singleProduct({ body: { productId: 'p1' } }, res)

    expect(MockProductModel.findById).toHaveBeenCalledWith('p1')
    expect(res.json).toHaveBeenCalledWith({ success: true, product })
  })

  it('returns success: false with error message on failure', async () => {
    MockProductModel.findById.mockRejectedValue(new Error('DB error'))

    const res = makeRes()
    await singleProduct({ body: { productId: 'bad-id' } }, res)

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'DB error',
    })
  })
})

// ─── addProductsBulk ──────────────────────────────────────────────────────────

describe('addProductsBulk', () => {
  beforeEach(() => jest.clearAllMocks())

  const makeBulkReq = (productsData, files = []) => ({
    body: { products: JSON.stringify(productsData) },
    files,
  })

  it('returns 400 when products data is empty array', async () => {
    const res = makeRes()
    await addProductsBulk(makeBulkReq([]), res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid products data',
    })
  })

  it('returns 400 when products field is not an array', async () => {
    const res = makeRes()
    await addProductsBulk(
      { body: { products: JSON.stringify({ name: 'x' }) }, files: [] },
      res
    )

    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('uploads images scoped by product index fieldname prefix', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    MockProductModel.insertMany.mockResolvedValue()

    const products = [
      {
        name: 'A',
        description: 'd',
        price: '10',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S'],
        bestSeller: false,
      },
    ]
    const files = [
      { fieldname: 'product_0_image1', path: '/tmp/a.jpg' },
      { fieldname: 'other_field', path: '/tmp/b.jpg' },
    ]

    const res = makeRes()
    await addProductsBulk(makeBulkReq(products, files), res)

    expect(cloudinary.uploader.upload).toHaveBeenCalledTimes(1)
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith('/tmp/a.jpg', {
      resource_type: 'image',
    })
  })

  it('saves all products via insertMany and returns success', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    MockProductModel.insertMany.mockResolvedValue()

    const products = [
      {
        name: 'A',
        description: 'd',
        price: '10',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S'],
        bestSeller: false,
      },
      {
        name: 'B',
        description: 'd',
        price: '20',
        category: 'Women',
        subCategory: 'Top',
        sizes: ['M'],
        bestSeller: true,
      },
    ]

    const res = makeRes()
    await addProductsBulk(makeBulkReq(products, []), res)

    expect(MockProductModel.insertMany).toHaveBeenCalledTimes(1)
    expect(MockProductModel.insertMany.mock.calls[0][0]).toHaveLength(2)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Products Added Successfully',
    })
  })

  it('coerces bestSeller from string "true" and boolean true', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    MockProductModel.insertMany.mockResolvedValue()

    const products = [
      {
        name: 'A',
        description: 'd',
        price: '10',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S'],
        bestSeller: 'true',
      },
      {
        name: 'B',
        description: 'd',
        price: '20',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S'],
        bestSeller: true,
      },
    ]

    const res = makeRes()
    await addProductsBulk(makeBulkReq(products, []), res)

    const saved = MockProductModel.insertMany.mock.calls[0][0]
    expect(saved[0].bestSeller).toBe(true)
    expect(saved[1].bestSeller).toBe(true)
  })

  it('accepts sizes as array or JSON string', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })
    MockProductModel.insertMany.mockResolvedValue()

    const products = [
      {
        name: 'A',
        description: 'd',
        price: '10',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S', 'M'],
        bestSeller: false,
      },
      {
        name: 'B',
        description: 'd',
        price: '20',
        category: 'Men',
        subCategory: 'Top',
        sizes: JSON.stringify(['L', 'XL']),
        bestSeller: false,
      },
    ]

    const res = makeRes()
    await addProductsBulk(makeBulkReq(products, []), res)

    const saved = MockProductModel.insertMany.mock.calls[0][0]
    expect(saved[0].sizes).toEqual(['S', 'M'])
    expect(saved[1].sizes).toEqual(['L', 'XL'])
  })

  it('returns 500 with error message on failure', async () => {
    cloudinary.uploader.upload.mockRejectedValue(new Error('Upload failed'))

    const products = [
      {
        name: 'A',
        description: 'd',
        price: '10',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S'],
        bestSeller: false,
      },
    ]
    const files = [{ fieldname: 'product_0_image1', path: '/tmp/a.jpg' }]

    const res = makeRes()
    await addProductsBulk(makeBulkReq(products, files), res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Upload failed',
    })
  })
})
