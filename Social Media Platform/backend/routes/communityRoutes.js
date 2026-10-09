const express = require('express');
const router = express.Router();
const {
  createCommunity,
  getAllCommunities,
  getCommunityBySlug,
  getCommunityPosts,
  toggleJoinCommunity,
  getCommunityMembers,
} = require('../controllers/communityController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getAllCommunities);
router.post('/', protect, createCommunity);
router.get('/:slug', optionalAuth, getCommunityBySlug);
router.get('/:slug/posts', optionalAuth, getCommunityPosts);
router.get('/:slug/members', getCommunityMembers);
router.post('/:id/join', protect, toggleJoinCommunity);

module.exports = router;
