const Order = require('../models/Order');

/**
 * Generate a unique order ID with SE- prefix
 * Format: SE-<timestamp>-<random4digits>
 */
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SE-${timestamp}-${random}`;
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 */
const createOrder = async (req, res, next) => {
  try {
    const {
      customerName, email, phone, address, city, state, pinCode,
      items, paymentMethod
    } = req.body;

    // Validate required fields
    if (!customerName || !email || !phone || !address || !city || !state || !pinCode) {
      const error = new Error('All customer details are required');
      error.statusCode = 400;
      throw error;
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('Order must contain at least one item');
      error.statusCode = 400;
      throw error;
    }

    // Validate payment method
    if (!paymentMethod || !['Cash on Delivery', 'Demo Card Payment'].includes(paymentMethod)) {
      const error = new Error('Invalid payment method');
      error.statusCode = 400;
      throw error;
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      const error = new Error('Please enter a valid email address');
      error.statusCode = 400;
      throw error;
    }

    // Validate phone (Indian 10-digit)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      const error = new Error('Please enter a valid 10-digit Indian phone number');
      error.statusCode = 400;
      throw error;
    }

    // Validate PIN code (6 digits)
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(pinCode)) {
      const error = new Error('Please enter a valid 6-digit PIN code');
      error.statusCode = 400;
      throw error;
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.name || !item.price || !item.quantity) {
        const error = new Error('Each item must have productId, name, price, and quantity');
        error.statusCode = 400;
        throw error;
      }
      if (item.quantity < 1) {
        const error = new Error('Item quantity must be at least 1');
        error.statusCode = 400;
        throw error;
      }
      if (item.price < 0) {
        const error = new Error('Item price cannot be negative');
        error.statusCode = 400;
        throw error;
      }
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryCharge = subtotal >= 999 ? 0 : 50;
    const totalAmount = subtotal + deliveryCharge;

    // Generate unique order ID
    const orderId = generateOrderId();

    // Create order document
    const order = await Order.create({
      orderId,
      customerName,
      email,
      phone,
      address,
      city,
      state,
      pinCode,
      items,
      subtotal,
      deliveryCharge,
      totalAmount,
      paymentMethod,
      orderStatus: 'Order Confirmed'
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get an order by order ID
 * @route   GET /api/orders/:id
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderById
};
