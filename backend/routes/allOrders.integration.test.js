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

const adminToken = () =>
  jwt.sign({ id: 'admin-id', role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  })

const userToken = () =>
  jwt.sign({ id: 'user-id', role: 'user' }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  })

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

// ─── POST /api/order/list ─────────────────────────────────────────────────────

describe('POST /api/order/list (allOrders)', () => {
  it('returns every order for an admin token', async () => {
    await seedOrder({ userId: 'user-1' })
    await seedOrder({ userId: 'user-2' })

    const res = await request(app)
      .post('/api/order/list')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({})

    expect(res.body.success).toBe(true)
    expect(res.body.orders).toHaveLength(2)
  })

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/order/list').send({})

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 403 with a non-admin token', async () => {
    const res = await request(app)
      .post('/api/order/list')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({})

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })
})
