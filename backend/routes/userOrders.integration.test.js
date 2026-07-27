import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  jest,
} from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'

// ─── Env before importing the route (Stripe is constructed at module load) ─────

process.env.JWT_SECRET = 'test-secret'
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'

const { default: orderRouter } = await import('./orderRoute.js')
const { default: orderModel } = await import('../models/orderModel.js')

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = express()
app.use(express.json())
app.use('/api/order', orderRouter)

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
  await orderModel.deleteMany({})
  jest.clearAllMocks()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' })

const seedOrder = (overrides = {}) =>
  orderModel.create({
    userId: 'user-1',
    items: [{ name: 'Shirt', quantity: 1, price: 100, size: 'M' }],
    amount: 110,
    address: { firstName: 'Jane' },
    paymentMethod: 'COD',
    payment: false,
    date: Date.now(),
    ...overrides,
  })

// ─── POST /api/order/userorders ───────────────────────────────────────────────

describe('POST /api/order/userorders', () => {
  it("returns only the authenticated user's orders", async () => {
    await seedOrder({ userId: 'user-1', amount: 110 })
    await seedOrder({ userId: 'user-1', amount: 220 })
    await seedOrder({ userId: 'other-user', amount: 999 })

    const res = await request(app)
      .post('/api/order/userorders')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({})

    expect(res.body.success).toBe(true)
    expect(res.body.orders).toHaveLength(2)
    expect(res.body.orders.every((o) => o.userId === 'user-1')).toBe(true)
  })

  it('returns an empty list when the user has no orders', async () => {
    await seedOrder({ userId: 'someone-else' })

    const res = await request(app)
      .post('/api/order/userorders')
      .set('Authorization', `Bearer ${tokenFor('user-1')}`)
      .send({})

    expect(res.body.success).toBe(true)
    expect(res.body.orders).toEqual([])
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/order/userorders').send({})

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .post('/api/order/userorders')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({})

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
