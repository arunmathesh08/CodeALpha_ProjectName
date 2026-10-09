const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getCategoryCounts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// GET /api/products/category-counts — Get category counts
router.get('/category-counts', getCategoryCounts);

// GET /api/products — Get all products
router.get('/', getAllProducts);

// GET /api/products/:id — Get single product
router.get('/:id', getProductById);

// POST /api/products — Create a product
router.post('/', createProduct);

// PUT /api/products/:id — Update a product
router.put('/:id', updateProduct);

// DELETE /api/products/:id — Delete a product
router.delete('/:id', deleteProduct);

module.exports = router;
