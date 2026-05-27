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
import bcrypt from 'bcrypt'
import userRouter from './userRoutes.js'
import userModel from '../models/userModel.js'

// ─── Test app ─────────────────────────────────────────────────────────────────
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
  await userModel.deleteMany({})
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Seeds a user directly in the database so login tests don't depend on the
// registration endpoint. Role defaults to 'admin' for these tests.
const seedUser = async ({
  email = 'admin@example.com',
  password = 'Password123!',
  role = 'admin',
} = {}) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = new userModel({
    name: 'Admin',
    email,
    password: hashedPassword,
    role,
  })
  return user.save()
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/user/admin', () => {
  it('logs in an admin and returns a token containing the id, admin role, and 3d expiry', async () => {
    const user = await seedUser()

    const res = await request(app).post('/api/user/admin').send({
      email: 'admin@example.com',
      password: 'Password123!',
    })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded.id).toBe(user._id.toString())
    expect(decoded.role).toBe('admin')
    expect(decoded.exp).toBeDefined()
    expect(decoded.iat).toBeDefined()
    const threeDaysInSeconds = 3 * 24 * 60 * 60
    expect(decoded.exp - decoded.iat).toBe(threeDaysInSeconds)
  })

  it('matches the admin email case-insensitively', async () => {
    await seedUser({ email: 'admin@example.com' })

    const res = await request(app).post('/api/user/admin').send({
      email: 'ADMIN@EXAMPLE.COM',
      password: 'Password123!',
    })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()
  })

  it('rejects a valid non-admin user with role user', async () => {
    await seedUser({ email: 'user@example.com', role: 'user' })

    const res = await request(app).post('/api/user/admin').send({
      email: 'user@example.com',
      password: 'Password123!',
    })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid Credentials')
    expect(res.body.token).toBeUndefined()
  })

  it('returns success: false when the email does not exist', async () => {
    const res = await request(app).post('/api/user/admin').send({
      email: 'nobody@example.com',
      password: 'Password123!',
    })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid Credentials')
  })

  it('returns success: false when the password is incorrect', async () => {
    await seedUser()

    const res = await request(app).post('/api/user/admin').send({
      email: 'admin@example.com',
      password: 'WrongPassword!',
    })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid Credentials')
  })
})
