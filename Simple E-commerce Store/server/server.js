const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const Product = require('./models/Product');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// --- Middleware ---

// Enable CORS for all origins (suitable for development)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from the client directory
app.use(express.static(path.join(__dirname, '..', 'client')));

// --- API Routes ---
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// --- Serve Frontend ---
// For any non-API route, serve the frontend index.html
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
  }
});

// --- Centralized Error Handler (must be after routes) ---
app.use(errorHandler);

// --- Sample product data for auto-seeding ---
const sampleProducts = require('./data/productsData');

/**
 * Auto-seed products if the database is empty or needs updated dataset.
 * This ensures products are available even with in-memory MongoDB.
 */
async function autoSeed() {
  try {
    const firstDoc = await Product.findOne({ sku: sampleProducts[0].sku });
    const count = await Product.countDocuments();
    const needsReseed = count !== sampleProducts.length || (firstDoc && firstDoc.image !== sampleProducts[0].image);

    if (needsReseed) {
      await Product.deleteMany({});
      await Product.insertMany(sampleProducts);
      console.log(`✅ Auto-seeded ${sampleProducts.length} unique sample products with updated images`);
    } else {
      console.log(`ℹ️  Database has ${count} unique products up to date`);
    }
  } catch (err) {
    console.error('⚠️  Auto-seed failed:', err.message);
  }
}

// --- Start Server ---
const PORT = process.env.PORT || 5000;

async function startServer() {
  // Connect to MongoDB first
  await connectDB();

  // Auto-seed products
  await autoSeed();

  // Start listening
  app.listen(PORT, () => {
    console.log(`🚀 ShopEase server running on http://localhost:${PORT}`);
    console.log(`📦 API available at http://localhost:${PORT}/api`);
  });
}

startServer();
