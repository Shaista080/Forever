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
import productModel from './productModel.js'

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
  await productModel.deleteMany({})
})

const validProduct = {
  name: 'Test Shirt',
  description: 'A great shirt',
  price: 49,
  image: ['img1.png'],
  category: 'Men',
  subCategory: 'Topwear',
  sizes: ['S', 'M', 'L'],
  date: Date.now(),
}

describe('productModel schema', () => {
  it('saves a valid product successfully', async () => {
    const product = new productModel(validProduct)
    const saved = await product.save()
    expect(saved._id).toBeDefined()
  })

  it.each([
    ['name', { ...validProduct, name: undefined }],
    ['description', { ...validProduct, description: undefined }],
    ['price', { ...validProduct, price: undefined }],
    ['image', { ...validProduct, image: undefined }],
    ['image', { ...validProduct, image: [] }],
    ['category', { ...validProduct, category: undefined }],
    ['subCategory', { ...validProduct, subCategory: undefined }],
    ['sizes', { ...validProduct, sizes: undefined }],
    ['sizes', { ...validProduct, sizes: [] }],
    ['date', { ...validProduct, date: undefined }],
  ])(
    'throws validation error when %s is missing or empty',
    async (field, data) => {
      const product = new productModel(data)
      await expect(product.save()).rejects.toThrow(new RegExp(field))
    }
  )

  it('saves without bestSeller — field is optional', async () => {
    const product = new productModel({
      name: validProduct.name,
      description: validProduct.description,
      price: validProduct.price,
      image: validProduct.image,
      category: validProduct.category,
      subCategory: validProduct.subCategory,
      sizes: validProduct.sizes,
      date: validProduct.date,
    })
    const saved = await product.save()
    expect(saved._id).toBeDefined()
    expect(saved.bestSeller).toBeUndefined()
  })

  it('stores price as Number and date as Number', async () => {
    const product = new productModel(validProduct)
    const saved = await product.save()
    expect(typeof saved.price).toBe('number')
    expect(typeof saved.date).toBe('number')
  })
})
