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

const seedOrder = () =>
  orderModel.create({
    userId: 'user-1',
    items: [{ name: 'Shirt', quantity: 1, price: 100, size: 'M' }],
    amount: 110,
    address: { firstName: 'Jane' },
    status: 'Order Placed',
    paymentMethod: 'COD',
    payment: false,
    date: Date.now(),
  })

// ─── POST /api/order/status ───────────────────────────────────────────────────

describe('POST /api/order/status (updateStatus)', () => {
  it('updates the order status in the DB for an admin token', async () => {
    const order = await seedOrder()

    const res = await request(app)
      .post('/api/order/status')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ orderId: order._id.toString(), status: 'Shipped' })

    expect(res.body.success).toBe(true)
    expect(res.body.message).toBe('Status updated')

    const updated = await orderModel.findById(order._id)
    expect(updated.status).toBe('Shipped')
  })

  it('returns 401 without a token', async () => {
    const order = await seedOrder()

    const res = await request(app)
      .post('/api/order/status')
      .send({ orderId: order._id.toString(), status: 'Shipped' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 403 with a non-admin token', async () => {
    const order = await seedOrder()

    const res = await request(app)
      .post('/api/order/status')
      .set('Authorization', `Bearer ${userToken()}`)
      .send({ orderId: order._id.toString(), status: 'Shipped' })

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)

    // status unchanged
    const untouched = await orderModel.findById(order._id)
    expect(untouched.status).toBe('Order Placed')
  })
})
