import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import { runSeed } from './scripts/seed.js'

//App Config
const app = express()
const port = process.env.PORT || 4000

const startServer = async () => {
  await connectDB()
  connectCloudinary()
  await runSeed()

  //Middlewares
  app.use(express.json())
  app.use(cors())

  //API endpoints
  app.use('/api/user', userRouter)
  app.use('/api/product', productRouter)
  app.use('/api/cart', cartRouter)
  app.use('/api/order', orderRouter)

  app.get('/', (req, res) => {
    res.send('API WORKING')
  })

  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port} ❤️`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server:', error.message)
  process.exit(1)
})
