import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'
import userModel from '../models/userModel.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const IMAGES_BASE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'frontend',
  'src',
  'assets'
)
const SEED_DATA_PATH = path.join(__dirname, 'seed-data.json')
const SKIP_IMAGE_UPLOAD = process.env.SKIP_IMAGE_UPLOAD === 'true'
const PLACEHOLDER_IMAGE_URL = 'https://placehold.co/600x800?text=Product'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
})

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce-forever`)
    console.log('MongoDB Connected for seeding!')
  } catch (error) {
    console.error('Error connecting to MongoDB for seeding:', error.message)
    process.exit(1)
  }
}

const seedUser = async ({ email, password, name, role, label }) => {
  if (!email || !password || !name) {
    console.log(`Skipping ${label} seed: email/password/name not set.`)
    return
  }

  const lowerEmail = email.toLowerCase()
  const existing = await userModel.findOne({ email: lowerEmail })
  if (existing) {
    console.log(`${label} already exists, skipping.`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  await userModel.create({
    name,
    email: lowerEmail,
    password: hashedPassword,
    role,
  })
  console.log(`${label} seeded.`)
}

const seedUsers = async () => {
  await seedUser({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    name: process.env.ADMIN_NAME,
    role: 'admin',
    label: 'Admin user',
  })

  await seedUser({
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    name: process.env.TEST_USER_NAME,
    role: 'user',
    label: 'Test user',
  })
}

export const runSeed = async () => {
  try {
    await seedUsers()

    console.log('Clearing existing products from the database...')
    await productModel.deleteMany({})
    console.log('Existing products cleared.')

    const productsData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'))
    let productsToInsert = []

    console.log(
      SKIP_IMAGE_UPLOAD
        ? 'SKIP_IMAGE_UPLOAD is set — using placeholder images, no Cloudinary upload...'
        : 'Starting product image uploads to Cloudinary and preparing data...'
    )
    for (const product of productsData) {
      const imagesUrl = []
      if (product.images && product.images.length > 0) {
        for (const imageName of product.images) {
          if (SKIP_IMAGE_UPLOAD) {
            imagesUrl.push(PLACEHOLDER_IMAGE_URL)
            continue
          }

          const imagePath = path.join(IMAGES_BASE_PATH, imageName)
          if (fs.existsSync(imagePath)) {
            try {
              const result = await cloudinary.uploader.upload(imagePath, {
                resource_type: 'image',
              })
              imagesUrl.push(result.secure_url)
            } catch (uploadError) {
              console.warn(
                `Warning: Failed to upload image ${imageName} for product ${product.name}:`,
                uploadError.message
              )
              // Optionally, push a placeholder or skip this image
            }
          } else {
            console.log(`DEBUG: IMAGES_BASE_PATH is ${IMAGES_BASE_PATH}`)
            console.log(`DEBUG: Calculated imagePath is ${imagePath}`)
            console.warn(
              `Warning: Local image file not found for product ${product.name}: ${imageName}`
            )
            // Optionally, push a placeholder or skip this image
          }
        }
      }

      productsToInsert.push({
        ...product,
        price: Number(product.price),
        bestSeller:
          product.bestSeller === 'true' || product.bestSeller === true,
        sizes: Array.isArray(product.sizes)
          ? product.sizes
          : JSON.parse(product.sizes),
        image: imagesUrl, // Use Cloudinary URLs
        date: Date.now(),
      })
    }

    if (productsToInsert.length > 0) {
      console.log(
        `Inserting ${productsToInsert.length} products into the database...`
      )
      await productModel.insertMany(productsToInsert)
      console.log('Database seeded successfully!')
    } else {
      console.log('No products to insert.')
    }
  } catch (error) {
    console.error('An error occurred during seeding:', error.message)
    throw error
  }
}

// True only when this file is executed directly (`node scripts/seed.js`),
// not when server.js imports runSeed — server.js manages its own connection
// and must not have it closed out from under it after seeding.
const isStandalone =
  process.argv[1] && import.meta.url === `file://${process.argv[1]}`

if (isStandalone) {
  connectDB()
    .then(runSeed)
    .catch((error) => {
      console.error('Seeding failed:', error.message)
      process.exitCode = 1
    })
    .finally(() => {
      mongoose.connection.close()
      console.log('MongoDB connection closed.')
    })
}
