import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/Product';
import User from './src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pantryhub';

const seedProducts = [
  {
    name: 'Fresh Organic Tomatoes',
    description: 'Locally grown, pesticide-free tomatoes, picked fresh this morning.',
    price: 45,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop',
    stock: 100,
    freshnessScore: 98,
    source: 'Farmer',
    qualityGrade: 'A'
  },
  {
    name: 'Green Spinach Bundle',
    description: 'Crisp and nutrient-rich spinach leaves.',
    price: 30,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop',
    stock: 50,
    freshnessScore: 95,
    source: 'Warehouse',
    qualityGrade: 'A'
  },
  {
    name: 'Alphonso Mangoes',
    description: 'Sweet, juicy, and premium quality Alphonso mangoes.',
    price: 250,
    category: 'Fruits',
    imageUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop',
    stock: 30,
    freshnessScore: 90,
    source: 'Farmer',
    qualityGrade: 'A'
  },
  {
    name: 'Whole Wheat Bread',
    description: 'Freshly baked, 100% whole wheat bread.',
    price: 50,
    category: 'Grocery',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop',
    stock: 20,
    freshnessScore: 100,
    source: 'Warehouse',
    qualityGrade: 'A'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database');

    await Product.deleteMany({});
    console.log('Products cleared');

    await Product.insertMany(seedProducts);
    console.log('Seed data inserted');

    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
};

seedDB();
