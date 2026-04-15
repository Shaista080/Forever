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
import userModel from './userModel.js'

// ─── Database setup ───────────────────────────────────────────────────────────
// We use mongodb-memory-server to spin up a real MongoDB instance in RAM.
// Mongoose needs a real connection because schema validation and unique indexes
// are enforced by MongoDB itself — they cannot run against a mock.

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
  // Wipe the collection between tests so each test starts with an empty database
  await userModel.deleteMany({})
})

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('userModel schema', () => {
  const validUser = {
    name: 'Alice',
    email: 'alice@example.com',
    password: 'hashedpassword123',
  }

  it('saves a valid user successfully', async () => {
    const user = new userModel(validUser)
    const saved = await user.save()
    expect(saved._id).toBeDefined()
  })

  it('throws a validation error when name is missing', async () => {
    const user = new userModel({
      email: 'alice@example.com',
      password: 'hashedpassword123',
    })
    await expect(user.save()).rejects.toThrow(/name/)
  })

  it('throws a validation error when email is missing', async () => {
    const user = new userModel({ name: 'Alice', password: 'hashedpassword123' })
    await expect(user.save()).rejects.toThrow(/email/)
  })

  it('throws a validation error when password is missing', async () => {
    const user = new userModel({ name: 'Alice', email: 'alice@example.com' })
    await expect(user.save()).rejects.toThrow(/password/)
  })

  it('defaults cartData to an empty object when not provided', async () => {
    const user = new userModel(validUser)
    const saved = await user.save()
    expect(saved.cartData).toEqual({})
  })

  it('throws a duplicate key error when two users share the same email', async () => {
    await new userModel(validUser).save()
    const duplicate = new userModel({ ...validUser, name: 'Bob' })
    await expect(duplicate.save()).rejects.toThrow(/duplicate key|E11000/)
  })
})
