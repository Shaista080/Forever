import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'

const connectDB = async () => {
  await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce-forever`)
  console.log('MongoDB Connected for admin seeding!')
}

const seedAdmin = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
    process.exit(1)
  }

  if (ADMIN_PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters')
    process.exit(1)
  }

  await connectDB()

  try {
    const email = ADMIN_EMAIL.toLowerCase()
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)

    const result = await userModel.findOneAndUpdate(
      { email },
      {
        $set: {
          name: ADMIN_NAME || 'Admin',
          email,
          password: hashedPassword,
          role: 'admin',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    console.log(`Admin user seeded: ${result.email} (role=${result.role})`)
  } catch (error) {
    console.error('Error seeding admin:', error.message)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('MongoDB connection closed.')
  }
}

seedAdmin()
