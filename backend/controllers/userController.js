import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import userModel from '../models/userModel.js'

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET)
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
      const token = createToken(user._id)
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

    // checking user already exist or not
    const exists = await userModel.findOne({ email })
    if (exists) {
      return res.json({ success: false, message: 'User already exists' })
    }

    //validating email formate and strong password
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: 'Please enter a valid email',
      })
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: 'Please enter a strong password',
      })
    }

    //hashing user password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newUser = new userModel({ name, email, password: hashedPassword })

    const user = await newUser.save()

    const token = createToken(user._id)

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

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: 'admin', role: 'admin' },
        process.env.JWT_SECRET
      )
      res.json({ success: true, token })
    } else {
      res.json({
        success: false,
        message: 'Invalid Credentials',
      })
    }
  } catch (e) {
    console.log(e)
    res.json({ success: false, message: e.message })
  }
}
