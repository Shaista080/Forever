import orderModel from '../models/orderModel.js'
import userModel from '../models/userModel.js'
import Stripe from 'stripe'

//GLOBAL VARIABLES
const currency = 'usd'
const deliveryCharges = 10

//GET WAY INITIALIZE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// PLACING ORDERS USING COD
export const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: 'COD',
      payment: false,
      date: Date.now(),
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    await userModel.findByIdAndUpdate(userId, { cartData: {} })

    res.json({ success: true, message: 'Order Placed' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// PLACING ORDERS USING STRIPE
export const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body

    const { origin } = req.headers

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: 'Stripe',
      payment: false,
      date: Date.now(),
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }))

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: 'Delivery Charges',
        },
        unit_amount: deliveryCharges * 100,
      },
      quantity: 1,
    })

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: 'payment',
    })

    res.json({ success: true, session_url: session.url })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//VERIFY STRIPE
export const verifyStripe = async (req, res) => {
  const { orderId, success, userId } = req.body

  try {
    if (success === 'true') {
      await orderModel.findByIdAndUpdate(orderId, { payment: true })
      await userModel.findByIdAndUpdate(userId, { cartData: {} })
      res.json({ success: true })
    } else {
      await orderModel.findByIdAndDelete(orderId)
      res.json({ success: false })
    }
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// PLACING ORDERS USING RAZORPAY
export const placeOrderRazorpay = async () => {}

//ALL ORDERS DATA FOR ADMIN PANEL
export const allOrders = async (res) => {
  try {
    const orders = await orderModel.find()
    res.json({ success: true, orders })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//USER ORDERS DATA FOR FRONTEND
export const userOrders = async (req, res) => {
  try {
    const { userId } = req.body

    const orders = await orderModel.find({ userId })

    res.json({ success: true, orders })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

//UPDATE ORDER STATUS FROM ADMIN PANEL
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body

    await orderModel.findByIdAndUpdate(orderId, { status })

    res.json({ success: true, message: 'Status updated' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}
