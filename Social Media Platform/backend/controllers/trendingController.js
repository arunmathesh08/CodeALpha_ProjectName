const Post = require('../models/Post');
const Community = require('../models/Community');
const PostLike = require('../models/PostLike');
const PostVote = require('../models/PostVote');
const SavedPost = require('../models/SavedPost');

// @desc    Get trending overview (posts, communities, topics)
// @route   GET /api/trending
// @access  Public (Optional Auth)
exports.getTrending = async (req, res) => {
  try {
    const currentUserId = req.user ? req.user._id : null;

    // 1. Trending Posts (highest score + comments)
    const trendingPosts = await Post.find()
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon')
      .sort({ score: -1, commentsCount: -1, createdAt: -1 })
      .limit(6);

    const postIds = trendingPosts.map((p) => p._id);
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

    const enrichedPosts = trendingPosts.map((p) => {
      const obj = p.toObject();
      obj.isLiked = !!likedMap[p._id.toString()];
      obj.userVote = voteMap[p._id.toString()] || 0;
      obj.isSaved = !!savedMap[p._id.toString()];
      obj.isAuthor = currentUserId ? currentUserId.toString() === (p.author ? p.author._id.toString() : null) : false;
      return obj;
    });

    // 2. Trending Communities
    const trendingCommunities = await Community.find()
      .sort({ memberCount: -1, postsCount: -1 })
      .limit(5);

    // 3. Trending Topics / Hashtags
    const tagAggregation = await Post.aggregate([
      { $unwind: '$tags' },
      { $match: { tags: { $ne: '' } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const trendingTopics = tagAggregation.map((t) => ({
      tag: t._id,
      postCount: t.count,
    }));

    // Fallback if no tags in posts yet
    const defaultTopics = [
      { tag: 'Technology', postCount: 142 },
      { tag: 'WebDevelopment', postCount: 98 },
      { tag: 'AIInnovation', postCount: 76 },
      { tag: 'IndieHackers', postCount: 54 },
      { tag: 'DesignSystems', postCount: 42 },
    ];

    res.status(200).json({
      success: true,
      data: {
        posts: enrichedPosts,
        communities: trendingCommunities,
        topics: trendingTopics.length > 0 ? trendingTopics : defaultTopics,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
