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
const { default: userModel } = await import('../models/userModel.js')

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
  await userModel.deleteMany({})
  jest.clearAllMocks()
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const tokenFor = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' })

const seedUser = () =>
  userModel.create({
    name: 'Jane',
    email: 'jane@example.com',
    password: 'hashed',
    cartData: { p1: { M: 2 } },
  })

const seedOrder = (userId) =>
  orderModel.create({
    userId,
    items: [{ name: 'Shirt', quantity: 1, price: 100, size: 'M' }],
    amount: 110,
    address: { firstName: 'Jane' },
    paymentMethod: 'Stripe',
    payment: false,
    date: Date.now(),
  })

// ─── POST /api/order/verifystripe ─────────────────────────────────────────────

describe('POST /api/order/verifystripe', () => {
  it('marks the order paid and clears the cart on success=true', async () => {
    const user = await seedUser()
    const order = await seedOrder(user._id.toString())

    const res = await request(app)
      .post('/api/order/verifystripe')
      .set('Authorization', `Bearer ${tokenFor(user._id.toString())}`)
      .send({ orderId: order._id.toString(), success: 'true' })

    expect(res.body.success).toBe(true)

    const updatedOrder = await orderModel.findById(order._id)
    expect(updatedOrder.payment).toBe(true)

    const updatedUser = await userModel.findById(user._id)
    expect(updatedUser.cartData).toEqual({})
  })

  it('deletes the order and leaves the cart on success=false', async () => {
    const user = await seedUser()
    const order = await seedOrder(user._id.toString())

    const res = await request(app)
      .post('/api/order/verifystripe')
      .set('Authorization', `Bearer ${tokenFor(user._id.toString())}`)
      .send({ orderId: order._id.toString(), success: 'false' })

    expect(res.body.success).toBe(false)

    expect(await orderModel.findById(order._id)).toBeNull()

    const untouchedUser = await userModel.findById(user._id)
    expect(untouchedUser.cartData).toEqual({ p1: { M: 2 } })
  })

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/order/verifystripe')
      .send({ orderId: 'x', success: 'true' })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
