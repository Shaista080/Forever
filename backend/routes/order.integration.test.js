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

// orderController does `new Stripe(process.env.STRIPE_SECRET_KEY)` at module
// load, which throws without a key. Set env + JWT secret, then dynamic-import
// the router so the controller module loads after the env is ready.
let app
let orderModel
let userModel
let mongoServer

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret'
  process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'

  const orderRouter = (await import('./orderRoute.js')).default
  orderModel = (await import('../models/orderModel.js')).default
  userModel = (await import('../models/userModel.js')).default

  app = express()
  app.use(express.json())
  app.use('/api/order', orderRouter)

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
})

// ─── Helpers ────────────────────────────────────────────────────────────────
const seedUser = async () => {
  const user = await userModel.create({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'hashed',
    cartData: { p1: { M: 2 } },
  })
  const token = jwt.sign(
    { id: user._id.toString(), role: 'user' },
    'test-secret'
  )
  return { user, auth: `Bearer ${token}` }
}

const orderBody = {
  items: [{ _id: 'p1', name: 'Shirt', price: 100, quantity: 2, size: 'M' }],
  amount: 210,
  address: { firstName: 'Alice', city: 'NYC' },
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/order/place (COD, integration)', () => {
  it('persists the order to Mongo with schema defaults and clears the cart', async () => {
    const { user, auth } = await seedUser()

    const res = await request(app)
      .post('/api/order/place')
      .set('Authorization', auth)
      .send(orderBody)

    expect(res.body).toEqual({ success: true, message: 'Order Placed' })

    // Order really landed in the DB with the model's defaults applied.
    const orders = await orderModel.find({ userId: user._id.toString() })
    expect(orders).toHaveLength(1)
    expect(orders[0]).toMatchObject({
      amount: 210,
      paymentMethod: 'COD',
      payment: false,
      status: 'Order Placed', // schema default
    })
    expect(orders[0].items).toHaveLength(1)

    // User cart was emptied via a real Mongo update.
    const updatedUser = await userModel.findById(user._id)
    expect(updatedUser.cartData).toEqual({})
  })

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).post('/api/order/place').send(orderBody)
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 when the token is invalid', async () => {
    const res = await request(app)
      .post('/api/order/place')
      .set('Authorization', 'Bearer not-a-real-token')
      .send(orderBody)
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
