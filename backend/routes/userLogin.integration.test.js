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

// ─── Helper ───────────────────────────────────────────────────────────────────
// Seeds a user directly in the database so login tests don't depend on the
// registration endpoint.
const seedUser = async (
  email = 'alice@example.com',
  password = 'Password123!'
) => {
  const hashedPassword = await bcrypt.hash(password, 10)
  const user = new userModel({
    name: 'Alice',
    email,
    password: hashedPassword,
  })
  return user.save()
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('POST /api/user/login', () => {
  it('logs in successfully and returns a token containing the user id', async () => {
    const user = await seedUser()

    const res = await request(app).post('/api/user/login').send({
      email: 'alice@example.com',
      password: 'Password123!',
    })

    expect(res.body.success).toBe(true)
    expect(res.body.token).toBeDefined()

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET)
    expect(decoded.id).toBe(user._id.toString())
  })

  it('returns success: false when the email does not exist', async () => {
    const res = await request(app).post('/api/user/login').send({
      email: 'nobody@example.com',
      password: 'Password123!',
    })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('User does not exists')
  })

  it('returns success: false when the password is incorrect', async () => {
    await seedUser()

    const res = await request(app).post('/api/user/login').send({
      email: 'alice@example.com',
      password: 'WrongPassword!',
    })

    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Invalid Credentials')
  })
})
