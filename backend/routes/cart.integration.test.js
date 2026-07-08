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
import cartRouter from './cartRoute.js'
import userModel from '../models/userModel.js'

// ─── Test app ─────────────────────────────────────────────────────────────────
// Minimal app mounting the real cart router (auth middleware included), so the
// JWT → req.body.userId wiring and real Mongo persistence are exercised.

const app = express()
app.use(express.json())
app.use('/api/cart', cartRouter)

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
  await userModel.deleteMany({})
})

// ─── Helpers ────────────────────────────────────────────────────────────────
const seedUser = async () => {
  const user = await userModel.create({
    name: 'Alice',
    email: 'alice@example.com',
    password: 'hashed',
    cartData: {},
  })
  const token = jwt.sign({ id: user._id.toString(), role: 'user' }, 'test-secret')
  return { user, token, auth: `Bearer ${token}` }
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Cart routes (integration)', () => {
  it('persists an added item to Mongo and reads it back via /get', async () => {
    const { user, auth } = await seedUser()

    const addRes = await request(app)
      .post('/api/cart/add')
      .set('Authorization', auth)
      .send({ itemId: 'p1', size: 'M' })

    expect(addRes.body.success).toBe(true)

    // Round-trips through real mongoose, not a mock.
    const stored = await userModel.findById(user._id)
    expect(stored.cartData).toEqual({ p1: { M: 1 } })

    const getRes = await request(app)
      .post('/api/cart/get')
      .set('Authorization', auth)
      .send({})

    expect(getRes.body.success).toBe(true)
    expect(getRes.body.cartData).toEqual({ p1: { M: 1 } })
  })

  it('supports a full add → update → get flow with the JWT-derived user', async () => {
    const { auth } = await seedUser()

    await request(app)
      .post('/api/cart/add')
      .set('Authorization', auth)
      .send({ itemId: 'p1', size: 'M' })
    await request(app)
      .post('/api/cart/add')
      .set('Authorization', auth)
      .send({ itemId: 'p1', size: 'M' }) // increments to 2
    await request(app)
      .post('/api/cart/update')
      .set('Authorization', auth)
      .send({ itemId: 'p1', size: 'M', quantity: 5 })

    const getRes = await request(app)
      .post('/api/cart/get')
      .set('Authorization', auth)
      .send({})

    expect(getRes.body.cartData).toEqual({ p1: { M: 5 } })
  })

  it('returns 401 when no Authorization header is sent', async () => {
    const res = await request(app).post('/api/cart/get').send({})
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  it('returns 401 when the token is invalid', async () => {
    const res = await request(app)
      .post('/api/cart/add')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ itemId: 'p1', size: 'M' })
    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })
})
