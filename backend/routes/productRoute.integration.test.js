import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

// ─── Mock cloudinary before any dynamic imports ───────────────────────────────

import { jest } from '@jest/globals'

jest.unstable_mockModule('cloudinary', () => ({
  v2: {
    uploader: { upload: jest.fn() },
  },
}))

const { v2: cloudinary } = await import('cloudinary')
const { default: productRouter } = await import('./productRoute.js')
const { default: productModel } = await import('../models/productModel.js')

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())
app.use('/api/product', productRouter)

// ─── Database setup ───────────────────────────────────────────────────────────

let mongoServer

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await productModel.deleteMany({})
  jest.clearAllMocks()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const adminToken = () =>
  jwt.sign({ id: 'admin-id', role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  })

const userToken = () =>
  jwt.sign({ id: 'user-id', role: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  })

const seedProduct = (overrides = {}) =>
  productModel.create({
    name: 'Test Shirt',
    description: 'A shirt',
    price: 49,
    image: ['img1.png'],
    category: 'Men',
    subCategory: 'Topwear',
    sizes: ['S', 'M'],
    date: Date.now(),
    ...overrides,
  })

// ─── GET /api/product/list ────────────────────────────────────────────────────

describe('GET /api/product/list', () => {
  it('returns all products with success: true', async () => {
    await seedProduct({ name: 'Shirt A' })
    await seedProduct({ name: 'Shirt B' })

    const res = await request(app).get('/api/product/list')

    expect(res.body.success).toBe(true)
    expect(res.body.products).toHaveLength(2)
    expect(res.body.products.map((p) => p.name)).toEqual(
      expect.arrayContaining(['Shirt A', 'Shirt B'])
    )
  })
})

// ─── POST /api/product/single ─────────────────────────────────────────────────

describe('POST /api/product/single', () => {
  it('returns product by id with success: true', async () => {
    const product = await seedProduct({ name: 'Solo Shirt' })

    const res = await request(app)
      .post('/api/product/single')
      .send({ productId: product._id.toString() })

    expect(res.body.success).toBe(true)
    expect(res.body.product.name).toBe('Solo Shirt')
  })

  // NOTE: when productId does not exist, mongoose findById returns null without
  // throwing — controller responds { success: true, product: null } instead of
  // a 404. Known gap in controller logic; no test asserts this broken behavior.
})

// ─── POST /api/product/remove ─────────────────────────────────────────────────

describe('POST /api/product/remove', () => {
  it('removes product and returns success: true', async () => {
    const product = await seedProduct()

    const res = await request(app)
      .post('/api/product/remove')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ id: product._id.toString() })

    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Product Removed')
    expect(await productModel.findById(product._id)).toBeNull()
  })

  it('returns 401 without token', async () => {
    const product = await seedProduct()

    const res = await request(app)
      .post('/api/product/remove')
      .send({ id: product._id.toString() })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 403 with non-admin token', async () => {
    const product = await seedProduct()

    const res = await request(app)
      .post('/api/product/remove')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ id: product._id.toString() })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})

// ─── POST /api/product/add ────────────────────────────────────────────────────

describe('POST /api/product/add', () => {
  it('adds product and returns success: true', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })

    const res = await request(app)
      .post('/api/product/add')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('name', 'New Jacket')
      .field('description', 'A jacket')
      .field('price', '99')
      .field('category', 'Men')
      .field('subCategory', 'Outerwear')
      .field('sizes', JSON.stringify(['M', 'L']))
      .field('bestSeller', 'false')
      .attach('image1', Buffer.from('fake-image'), 'image1.jpg')

    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Product Added')
    expect(await productModel.findOne({ name: 'New Jacket' })).not.toBeNull()
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/product/add')
      .field('name', 'New Jacket')

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})

// ─── POST /api/product/add-bulk ───────────────────────────────────────────────

describe('POST /api/product/add-bulk', () => {
  it('adds multiple products and returns success: true', async () => {
    cloudinary.uploader.upload.mockResolvedValue({
      secure_url: 'https://cdn/img.jpg',
    })

    const products = [
      {
        name: 'Bulk A',
        description: 'desc',
        price: '10',
        category: 'Men',
        subCategory: 'Top',
        sizes: ['S'],
        bestSeller: false,
      },
      {
        name: 'Bulk B',
        description: 'desc',
        price: '20',
        category: 'Women',
        subCategory: 'Top',
        sizes: ['M'],
        bestSeller: false,
      },
    ]

    const res = await request(app)
      .post('/api/product/add-bulk')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('products', JSON.stringify(products))
      .attach('product_0_image1', Buffer.from('fake-image'), 'p0img1.jpg')
      .attach('product_1_image1', Buffer.from('fake-image'), 'p1img1.jpg')

    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Products Added Successfully')
    expect(await productModel.countDocuments()).toBe(2)
  })

  it('returns 400 for invalid products data', async () => {
    const res = await request(app)
      .post('/api/product/add-bulk')
      .set('Authorization', `Bearer ${adminToken()}`)
      .field('products', JSON.stringify([]))

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/product/add-bulk')
      .field('products', JSON.stringify([]))

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
