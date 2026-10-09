const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');
const Follower = require('../models/Follower');
const CommunityMember = require('../models/CommunityMember');
const PostLike = require('../models/PostLike');
const PostVote = require('../models/PostVote');
const SavedPost = require('../models/SavedPost');

// @desc    Global search across users, posts, and communities
// @route   GET /api/search
// @access  Public (Optional Auth)
exports.searchAll = async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({
        success: true,
        data: { users: [], posts: [], communities: [] },
      });
    }

    const query = q.trim();
    const regex = new RegExp(query, 'i');
    const limitNum = parseInt(limit, 10) || 20;

    const currentUserId = req.user ? req.user._id.toString() : null;

    let users = [];
    let posts = [];
    let communities = [];

    if (type === 'all' || type === 'users') {
      const foundUsers = await User.find({
        $or: [{ username: regex }, { fullName: regex }, { bio: regex }],
      })
        .select('username fullName avatar bio location followersCount')
        .limit(limitNum);

      let followedIds = [];
      if (currentUserId) {
        const myFollows = await Follower.find({ follower: currentUserId });
        followedIds = myFollows.map((f) => f.following.toString());
      }

      users = foundUsers.map((u) => {
        const obj = u.toObject();
        obj.isFollowing = followedIds.includes(u._id.toString());
        obj.isSelf = currentUserId === u._id.toString();
        return obj;
      });
    }

    if (type === 'all' || type === 'communities') {
      const foundCommunities = await Community.find({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
        .populate('creator', 'username fullName avatar')
        .limit(limitNum);

      let joinedIds = [];
      if (currentUserId) {
        const myMemberships = await CommunityMember.find({ user: currentUserId });
        joinedIds = myMemberships.map((m) => m.community.toString());
      }

      communities = foundCommunities.map((c) => {
        const obj = c.toObject();
        obj.isMember = joinedIds.includes(c._id.toString());
        return obj;
      });
    }

    if (type === 'all' || type === 'posts') {
      const foundPosts = await Post.find({
        $or: [{ title: regex }, { content: regex }, { tags: regex }],
      })
        .populate('author', 'username fullName avatar')
        .populate('community', 'name slug icon')
        .sort({ score: -1, createdAt: -1 })
        .limit(limitNum);

      const postIds = foundPosts.map((p) => p._id);
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

      posts = foundPosts.map((p) => {
        const obj = p.toObject();
        obj.isLiked = !!likedMap[p._id.toString()];
        obj.userVote = voteMap[p._id.toString()] || 0;
        obj.isSaved = !!savedMap[p._id.toString()];
        obj.isAuthor = currentUserId === (p.author ? p.author._id.toString() : null);
        return obj;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        users,
        posts,
        communities,
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
