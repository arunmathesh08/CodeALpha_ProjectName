const express = require('express');
const router = express.Router();
const {
  createComment,
  getPostComments,
  toggleLikeComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, createComment);
router.get('/post/:postId', optionalAuth, getPostComments);
router.post('/:id/like', protect, toggleLikeComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
