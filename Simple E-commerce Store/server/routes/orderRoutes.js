const express = require('express');
const router = express.Router();
const { createOrder, getOrderById } = require('../controllers/orderController');

// POST /api/orders — Create a new order
router.post('/', createOrder);

// GET /api/orders/:id — Get order by order ID
router.get('/:id', getOrderById);

module.exports = router;
