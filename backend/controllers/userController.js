import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import userModel from '../models/userModel.js'

const TOKEN_EXPIRY = '3d'

const createToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  })
}

export const validateRegistrationInput = (email, password) => {
  if (!validator.isEmail(email)) {
    return { valid: false, message: 'Please enter a valid email' }
  }
  if (password.length < 8) {
    return { valid: false, message: 'Please enter a strong password' }
  }
  return { valid: true }
}

//Route for user login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({ success: false, message: 'User does not exists' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) {
      const token = createToken(user._id, user.role)
      res.json({ success: true, token })
    } else {
      return res.json({ success: false, message: 'Invalid Credentials' })
    }
  } catch (e) {
    console.log(e)
    res.json({ success: false, message: e.message })
  }
}

//Route for user register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const lowerCaseEmail = email.toLowerCase()

    const validation = validateRegistrationInput(lowerCaseEmail, password)
    if (!validation.valid) {
      return res.json({ success: false, message: validation.message })
    }

    const exists = await userModel.findOne({ email: lowerCaseEmail })
    if (exists) {
      return res.json({ success: false, message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new userModel({
      name,
      email: lowerCaseEmail,
      password: hashedPassword,
    })

    const user = await newUser.save()

    const token = createToken(user._id, user.role)

    res.json({ success: true, token })
  } catch (e) {
    console.log(e)
    res.json({ success: false, message: e.message })
  }
}

//Route for Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.json({ success: false, message: 'Invalid Credentials' })
    }

    const lowerCaseEmail = email.toLowerCase()
    const user = await userModel.findOne({
      email: lowerCaseEmail,
      role: 'admin',
    })

    if (!user) {
      return res.json({ success: false, message: 'Invalid Credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid Credentials' })
    }

    const token = createToken(user._id, user.role)
    res.json({ success: true, token })
  } catch (e) {
    console.log(e)
    res.json({ success: false, message: e.message })
  }
}
