const User = require('../models/User');
const Follower = require('../models/Follower');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostVote = require('../models/PostVote');
const SavedPost = require('../models/SavedPost');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// @desc    Get user profile by username
// @route   GET /api/users/:username
// @access  Public (Optional Auth)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Refresh dynamic counts
    const followersCount = await Follower.countDocuments({ following: user._id });
    const followingCount = await Follower.countDocuments({ follower: user._id });
    const postsCount = await Post.countDocuments({ author: user._id });

    let isFollowing = false;
    let isSelf = false;

    if (req.user) {
      isSelf = req.user._id.toString() === user._id.toString();
      if (!isSelf) {
        const followDoc = await Follower.findOne({
          follower: req.user._id,
          following: user._id,
        });
        isFollowing = !!followDoc;
      }
    }

    const userData = user.toObject();
    userData.followersCount = followersCount;
    userData.followingCount = followingCount;
    userData.postsCount = postsCount;
    userData.isFollowing = isFollowing;
    userData.isSelf = isSelf;

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, bio, location, avatar, coverImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (location !== undefined) user.location = location.trim();
    if (avatar) user.avatar = avatar;
    if (coverImage) user.coverImage = coverImage;

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Follow / Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
exports.toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (req.user._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingFollow = await Follower.findOne({
      follower: req.user._id,
      following: targetUserId,
    });

    let isFollowing = false;

    if (existingFollow) {
      // Unfollow
      await Follower.findByIdAndDelete(existingFollow._id);
      isFollowing = false;
    } else {
      // Follow
      await Follower.create({
        follower: req.user._id,
        following: targetUserId,
      });
      isFollowing = true;

      // Notification
      await Notification.create({
        recipient: targetUserId,
        sender: req.user._id,
        type: 'follow_user',
        message: `${req.user.fullName} (@${req.user.username}) started following you.`,
      });
    }

    const followersCount = await Follower.countDocuments({ following: targetUserId });
    const followingCount = await Follower.countDocuments({ follower: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        isFollowing,
        followersCount,
        followingCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get followers of a user
// @route   GET /api/users/:username/followers
// @access  Public (Optional Auth)
exports.getUserFollowers = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followers = await Follower.find({ following: user._id })
      .populate('follower', 'username fullName avatar bio')
      .sort({ createdAt: -1 });

    const currentUserId = req.user ? req.user._id.toString() : null;
    let currentUserFollowingIds = [];
    if (currentUserId) {
      const myFollows = await Follower.find({ follower: currentUserId });
      currentUserFollowingIds = myFollows.map((f) => f.following.toString());
    }

    const data = followers.map((f) => {
      const u = f.follower.toObject();
      u.isFollowing = currentUserFollowingIds.includes(u._id.toString());
      u.isSelf = currentUserId === u._id.toString();
      return u;
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get users followed by a user
// @route   GET /api/users/:username/following
// @access  Public (Optional Auth)
exports.getUserFollowing = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const followings = await Follower.find({ follower: user._id })
      .populate('following', 'username fullName avatar bio')
      .sort({ createdAt: -1 });

    const currentUserId = req.user ? req.user._id.toString() : null;
    let currentUserFollowingIds = [];
    if (currentUserId) {
      const myFollows = await Follower.find({ follower: currentUserId });
      currentUserFollowingIds = myFollows.map((f) => f.following.toString());
    }

    const data = followings.map((f) => {
      const u = f.following.toObject();
      u.isFollowing = currentUserFollowingIds.includes(u._id.toString());
      u.isSelf = currentUserId === u._id.toString();
      return u;
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get suggested users to follow
// @route   GET /api/users/suggested
// @access  Public (Optional Auth)
exports.getSuggestedUsers = async (req, res) => {
  try {
    let excludeIds = [];
    if (req.user) {
      excludeIds.push(req.user._id);
      const followingDocs = await Follower.find({ follower: req.user._id });
      followingDocs.forEach((f) => excludeIds.push(f.following));
    }

    const suggested = await User.find({ _id: { $nin: excludeIds } })
      .select('username fullName avatar bio location followersCount')
      .sort({ followersCount: -1, createdAt: -1 })
      .limit(6);

    res.status(200).json({ success: true, data: suggested });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user's posts
// @route   GET /api/users/:username/posts
// @access  Public (Optional Auth)
exports.getUserPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon')
      .sort({ createdAt: -1 });

    const currentUserId = req.user ? req.user._id.toString() : null;
    const postIds = posts.map((p) => p._id);

    let likedMap = {};
    let voteMap = {};
    let savedMap = {};

    if (currentUserId) {
      const [likes, votes, saves] = await Promise.all([
        PostLike.find({ user: currentUserId, post: { $in: postIds } }),
        PostVote.find({ user: currentUserId, post: { $in: postIds } }),
        SavedPost.find({ user: currentUserId, post: { $in: postIds } }),
      ]);
      likes.forEach((l) => (likedMap[l.post.toString()] = true));
      votes.forEach((v) => (voteMap[v.post.toString()] = v.voteType));
      saves.forEach((s) => (savedMap[s.post.toString()] = true));
    }

    const enrichedPosts = posts.map((p) => {
      const obj = p.toObject();
      obj.isLiked = !!likedMap[p._id.toString()];
      obj.userVote = voteMap[p._id.toString()] || 0;
      obj.isSaved = !!savedMap[p._id.toString()];
      obj.isAuthor = currentUserId === p.author._id.toString();
      return obj;
    });

    res.status(200).json({ success: true, data: enrichedPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user's comments
// @route   GET /api/users/:username/comments
// @access  Public (Optional Auth)
exports.getUserComments = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const comments = await Comment.find({ author: user._id })
      .populate('author', 'username fullName avatar')
      .populate({
        path: 'post',
        select: 'title _id community',
        populate: { path: 'community', select: 'name slug' },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get posts liked by user
// @route   GET /api/users/:username/liked
// @access  Public (Optional Auth)
exports.getUserLikedPosts = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const likedDocs = await PostLike.find({ user: user._id }).sort({ createdAt: -1 });
    const postIds = likedDocs.map((l) => l.post);

    const posts = await Post.find({ _id: { $in: postIds } })
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon')
      .sort({ createdAt: -1 });

    const currentUserId = req.user ? req.user._id.toString() : null;
    let likedMap = {};
    let voteMap = {};
    let savedMap = {};

    if (currentUserId) {
      const [likes, votes, saves] = await Promise.all([
        PostLike.find({ user: currentUserId, post: { $in: postIds } }),
        PostVote.find({ user: currentUserId, post: { $in: postIds } }),
        SavedPost.find({ user: currentUserId, post: { $in: postIds } }),
      ]);
      likes.forEach((l) => (likedMap[l.post.toString()] = true));
      votes.forEach((v) => (voteMap[v.post.toString()] = v.voteType));
      saves.forEach((s) => (savedMap[s.post.toString()] = true));
    }

    const enrichedPosts = posts.map((p) => {
      const obj = p.toObject();
      obj.isLiked = !!likedMap[p._id.toString()];
      obj.userVote = voteMap[p._id.toString()] || 0;
      obj.isSaved = !!savedMap[p._id.toString()];
      obj.isAuthor = currentUserId === (p.author ? p.author._id.toString() : null);
      return obj;
    });

    res.status(200).json({ success: true, data: enrichedPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user's saved posts
// @route   GET /api/users/saved
// @access  Private
exports.getUserSavedPosts = async (req, res) => {
  try {
    const savedDocs = await SavedPost.find({ user: req.user._id }).sort({ createdAt: -1 });
    const postIds = savedDocs.map((s) => s.post);

    const posts = await Post.find({ _id: { $in: postIds } })
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon')
      .sort({ createdAt: -1 });

    const currentUserId = req.user._id.toString();
    const [likes, votes] = await Promise.all([
      PostLike.find({ user: currentUserId, post: { $in: postIds } }),
      PostVote.find({ user: currentUserId, post: { $in: postIds } }),
    ]);

    const likedMap = {};
    const voteMap = {};
    likes.forEach((l) => (likedMap[l.post.toString()] = true));
    votes.forEach((v) => (voteMap[v.post.toString()] = v.voteType));

    const enrichedPosts = posts.map((p) => {
      const obj = p.toObject();
      obj.isLiked = !!likedMap[p._id.toString()];
      obj.userVote = voteMap[p._id.toString()] || 0;
      obj.isSaved = true;
      obj.isAuthor = currentUserId === (p.author ? p.author._id.toString() : null);
      return obj;
    });

    res.status(200).json({ success: true, data: enrichedPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
