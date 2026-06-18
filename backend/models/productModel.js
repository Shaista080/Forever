import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: {
    type: Array,
    required: true,
    validate: {
      validator: (v) => v.length > 0,
      message: 'image must not be empty',
    },
  },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: {
    type: Array,
    required: true,
    validate: {
      validator: (v) => v.length > 0,
      message: 'sizes must not be empty',
    },
  },
  bestSeller: { type: Boolean },
  date: { type: Number, required: true },
})

const productModel =
  mongoose.models.product || mongoose.model('product', productSchema)
export default productModel
