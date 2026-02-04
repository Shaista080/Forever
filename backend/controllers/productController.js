import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// function for add product
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
    } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    const imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestSeller: bestSeller === "true" ? true : false,
      sizes: JSON.parse(sizes),
      image: imagesUrl,
      date: Date.now(),
    };

    console.log(productData);

    const product = new productModel(productData);

    await product.save();

    res.json({ success: true, message: "Product Added" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// function for list product
export const listProduct = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// function for remove product
export const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Product Removed" });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// function for single product info
export const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);

    res.json({ success: true, product });
  } catch (e) {
    console.log(e);
    res.json({ success: false, message: e.message });
  }
};

// function for bulk add products
export const addProductsBulk = async (req, res) => {
  try {
    const productsData = JSON.parse(req.body.products);
    const files = req.files;

    if (!Array.isArray(productsData) || productsData.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid products data" });
    }

    let productsToSave = [];

    for (let i = 0; i < productsData.length; i++) {
      const product = productsData[i];
      
      // Find images for the current product
      const productImages = files.filter(file => file.fieldname.startsWith(`product_${i}_`));

      const imagesUrl = await Promise.all(
        productImages.map(async (item) => {
          let result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
          });
          return result.secure_url;
        })
      );

      const productToSave = {
        ...product,
        price: Number(product.price),
        bestSeller: product.bestSeller === "true" || product.bestSeller === true,
        sizes: Array.isArray(product.sizes) ? product.sizes : JSON.parse(product.sizes),
        image: imagesUrl,
        date: Date.now(),
      };
      
      productsToSave.push(productToSave);
    }

    await productModel.insertMany(productsToSave);

    res.json({ success: true, message: "Products Added Successfully" });

  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: e.message });
  }
};
