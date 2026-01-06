import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = 'http://localhost:4000';
const IMAGES_PATH = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets');
const SEED_DATA_PATH = path.join(__dirname, 'seed-data.json');

const getAdminToken = async () => {
  try {
    const response = await axios.post(`${API_URL}/api/user/admin`, {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    if (response.data.success) {
      console.log('Admin login successful.');
      return response.data.token;
    } else {
      throw new Error('Admin login failed: ' + response.data.message);
    }
  } catch (error) {
    console.error('Error getting admin token:', error.message);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  const token = await getAdminToken();

  try {
    const products = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'));
    const form = new FormData();

    // We need to strip the 'images' property from the product objects before stringifying
    const productsForPayload = products.map(p => {
        const { images, ...rest } = p;
        return rest;
    });

    form.append('products', JSON.stringify(productsForPayload));

    products.forEach((product, productIndex) => {
      if (product.images && product.images.length > 0) {
        product.images.forEach((imageName, imageIndex) => {
          const imagePath = path.join(IMAGES_PATH, imageName);
          if (fs.existsSync(imagePath)) {
            form.append(`product_${productIndex}_image_${imageIndex}`, fs.createReadStream(imagePath));
          } else {
            console.warn(`Warning: Image not found for product ${product.name}: ${imageName}`);
          }
        });
      }
    });

    console.log('Sending bulk product request...');
    const response = await axios.post(`${API_URL}/api/product/add-bulk`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (response.data.success) {
      console.log('Database seeded successfully!');
    } else {
      console.error('Failed to seed database:', response.data.message);
    }
  } catch (error) {
    console.error('An error occurred during seeding:', error.response ? error.response.data : error.message);
    process.exit(1);
  }
};

seedDatabase();
