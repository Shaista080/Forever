import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  adminLogin,
  loginUser,
  registerUser,
} from '../controllers/userController.js'

const userRouter = express.Router()

const adminLoginLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    success: false,
    message: 'Too many login attempts. Try again in 2 minutes.',
  },
})

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLoginLimiter, adminLogin)

export default userRouter
