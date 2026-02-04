import 'dotenv/config';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IMAGES_BASE_PATH = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets');
const SEED_DATA_PATH = path.join(__dirname, 'seed-data.json');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce-forever`);
    console.log("MongoDB Connected for seeding!");
  } catch (error) {
    console.error("Error connecting to MongoDB for seeding:", error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  await connectDB();

  try {
    console.log('Clearing existing products from the database...');
    await productModel.deleteMany({});
    console.log('Existing products cleared.');

    const productsData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'));
    let productsToInsert = [];

    console.log('Starting product image uploads to Cloudinary and preparing data...');
    for (const product of productsData) {
      const imagesUrl = [];
      if (product.images && product.images.length > 0) {
        for (const imageName of product.images) {
          const imagePath = path.join(IMAGES_BASE_PATH, imageName);
          if (fs.existsSync(imagePath)) {
            try {
              const result = await cloudinary.uploader.upload(imagePath, {
                resource_type: "image",
              });
              imagesUrl.push(result.secure_url);
            } catch (uploadError) {
              console.warn(`Warning: Failed to upload image ${imageName} for product ${product.name}:`, uploadError.message);
              // Optionally, push a placeholder or skip this image
            }
          } else {
            console.warn(`Warning: Local image file not found for product ${product.name}: ${imageName}`);
            // Optionally, push a placeholder or skip this image
          }
        }
      }

      productsToInsert.push({
        ...product,
        price: Number(product.price),
        bestSeller: product.bestSeller === "true" || product.bestSeller === true,
        sizes: Array.isArray(product.sizes) ? product.sizes : JSON.parse(product.sizes),
        image: imagesUrl, // Use Cloudinary URLs
        date: Date.now(),
      });
    }

    if (productsToInsert.length > 0) {
      console.log(`Inserting ${productsToInsert.length} products into the database...`);
      await productModel.insertMany(productsToInsert);
      console.log('Database seeded successfully!');
    } else {
      console.log('No products to insert.');
    }

  } catch (error) {
    console.error('An error occurred during seeding:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

seedDatabase();