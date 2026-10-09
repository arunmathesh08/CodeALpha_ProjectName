const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeed,
  getPostById,
  toggleLikePost,
  votePost,
  toggleSavePost,
  deletePost,
} = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getFeed);
router.post('/', protect, createPost);
router.get('/:id', optionalAuth, getPostById);
router.delete('/:id', protect, deletePost);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/vote', protect, votePost);
router.post('/:id/save', protect, toggleSavePost);

module.exports = router;
