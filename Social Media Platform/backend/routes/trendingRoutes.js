const express = require('express');
const router = express.Router();
const { getTrending } = require('../controllers/trendingController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getTrending);

module.exports = router;
