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
import userRouter from './userRoutes.js'
import userModel from '../models/userModel.js'

// ─── Test app ─────────────────────────────────────────────────────────────────
// We do NOT import server.js because it immediately calls connectDB() and
// connectCloudinary() as side effects. Instead we build a minimal Express app
// that only has what the registration route needs.

const app = express()
app.use(express.json())
app.use('/api/user', userRouter)

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
  // Clear users between tests so each test starts from a clean state
  await userModel.deleteMany({})
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/user/register', () => {
  const validBody = {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'validpass123',
  }

  it('registers successfully, returns a token, and the token contains the user id', async () => {
    const res = await request(app).post('/api/user/register').send(validBody)

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded.id).toBeDefined()
  })

  it('stores the password as a bcrypt hash, not as plaintext', async () => {
    await request(app).post('/api/user/register').send(validBody)

    const user = await userModel.findOne({ email: validBody.email })
    expect(user.password).not.toBe(validBody.password)
    // All bcrypt hashes start with $2b$ — this confirms hashing happened
    expect(user.password).toMatch(/^\$2b\$/)
  })

  it('returns success: false when the same email is registered twice', async () => {
    await request(app).post('/api/user/register').send(validBody)
    const res = await request(app).post('/api/user/register').send(validBody)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('User already exists')
  })

  it('stores the email in lowercase even when submitted in uppercase', async () => {
    await request(app)
      .post('/api/user/register')
      .send({ ...validBody, email: 'ALICE@EXAMPLE.COM' })

    const user = await userModel.findOne({ email: 'alice@example.com' })
    expect(user).not.toBeNull()
    expect(user.email).toBe('alice@example.com')
  })

  it('allows login with the same credentials immediately after registration', async () => {
    await request(app).post('/api/user/register').send(validBody)

    const loginRes = await request(app).post('/api/user/login').send({
      email: validBody.email,
      password: validBody.password,
    })

    expect(loginRes.body.success).toBe(true)
    expect(loginRes.body.token).toBeDefined()
  })
})
