const Product = require('../models/Product');

/**
 * @desc    Get all products
 * @route   GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    // Deduplicate products by _id and unique name
    const seenIds = new Set();
    const uniqueProducts = products.filter(p => {
      const id = p._id ? p._id.toString() : p.name;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });

    res.status(200).json({
      success: true,
      count: uniqueProducts.length,
      data: uniqueProducts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unique product counts for all categories
 * @route   GET /api/products/category-counts
 */
const getCategoryCounts = async (req, res, next) => {
  try {
    const products = await Product.find({});
    const seenIds = new Set();
    const seenNames = new Set();
    const uniqueProducts = products.filter(p => {
      const id = p._id ? p._id.toString() : p.name;
      const nameKey = (p.name || '').trim().toLowerCase();
      if (seenIds.has(id) || (nameKey && seenNames.has(nameKey))) return false;
      seenIds.add(id);
      if (nameKey) seenNames.add(nameKey);
      return true;
    });

    const counts = {};
    uniqueProducts.forEach(p => {
      const cat = p.category;
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: counts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single product by ID
 * @route   GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getCategoryCounts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
