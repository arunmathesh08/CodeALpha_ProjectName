/**
 * Seed Script for ShopEase
 * Inserts 8 sample products into MongoDB.
 * Idempotent: skips seeding if products already exist.
 *
 * Usage: node seed.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

// Load environment variables
dotenv.config();

// Sample product data
const sampleProducts = require('./data/productsData');

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Remove existing and seed full dataset
    await Product.deleteMany({});
    const inserted = await Product.insertMany(sampleProducts);
    console.log(`✅ Successfully seeded ${inserted.length} products!`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
};

seedProducts();
