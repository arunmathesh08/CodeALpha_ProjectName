const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  toggleFollow,
  getUserFollowers,
  getUserFollowing,
  getSuggestedUsers,
  getUserPosts,
  getUserComments,
  getUserLikedPosts,
  getUserSavedPosts,
} = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.put('/profile', protect, updateProfile);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.get('/saved', protect, getUserSavedPosts);
router.post('/:id/follow', protect, toggleFollow);
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/followers', optionalAuth, getUserFollowers);
router.get('/:username/following', optionalAuth, getUserFollowing);
router.get('/:username/posts', optionalAuth, getUserPosts);
router.get('/:username/comments', optionalAuth, getUserComments);
router.get('/:username/liked', optionalAuth, getUserLikedPosts);

module.exports = router;
