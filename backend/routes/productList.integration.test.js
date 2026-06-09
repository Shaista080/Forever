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
import productRouter from './productRoute.js'
import productModel from '../models/productModel.js'

// ─── Test app ─────────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())
app.use('/api/product', productRouter)

// ─── Database setup ───────────────────────────────────────────────────────────
let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await productModel.deleteMany({})
})

// ─── Helper ───────────────────────────────────────────────────────────────────
const seedProduct = (overrides = {}) =>
  productModel.create({
    name: 'Test Shirt',
    description: 'A test product',
    price: 29,
    image: ['img.png'],
    category: 'Men',
    subCategory: 'Topwear',
    sizes: ['S', 'M'],
    bestSeller: false,
    date: 1700000000000,
    ...overrides,
  })

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('GET /api/product/list', () => {
  it('returns empty products array when no products in DB', async () => {
    const res = await request(app).get('/api/product/list')

    expect(res.body.success).toBe(true)
    expect(res.body.products).toEqual([])
  })

  it('returns all seeded products with correct shape', async () => {
    await seedProduct({ name: 'Blue Shirt', category: 'Men' })
    await seedProduct({ name: 'Red Dress', category: 'Women' })

    const res = await request(app).get('/api/product/list')

    expect(res.body.success).toBe(true)
    expect(res.body.products).toHaveLength(2)

    const names = res.body.products.map((p) => p.name)
    expect(names).toContain('Blue Shirt')
    expect(names).toContain('Red Dress')

    const first = res.body.products[0]
    expect(first).toHaveProperty('_id')
    expect(first).toHaveProperty('name')
    expect(first).toHaveProperty('price')
    expect(first).toHaveProperty('category')
    expect(first).toHaveProperty('subCategory')
    expect(first).toHaveProperty('image')
  })
})

describe('POST /api/product/single', () => {
  it('returns the product matching the given id', async () => {
    const seeded = await seedProduct({ name: 'Green Jacket' })

    const res = await request(app)
      .post('/api/product/single')
      .send({ productId: seeded._id.toString() })

    expect(res.body.success).toBe(true)
    expect(res.body.product.name).toBe('Green Jacket')
    expect(res.body.product._id).toBe(seeded._id.toString())
  })

})
