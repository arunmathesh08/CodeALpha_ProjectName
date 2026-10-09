const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostVote = require('../models/PostVote');
const SavedPost = require('../models/SavedPost');
const Comment = require('../models/Comment');
const Follower = require('../models/Follower');
const CommunityMember = require('../models/CommunityMember');
const Community = require('../models/Community');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to enrich post documents with user interaction state
const enrichPostsWithUserState = async (posts, userId) => {
  if (!posts || posts.length === 0) return [];
  const postIds = posts.map((p) => p._id);

  let likedMap = {};
  let voteMap = {};
  let savedMap = {};

  if (userId) {
    const [likes, votes, saves] = await Promise.all([
      PostLike.find({ user: userId, post: { $in: postIds } }),
      PostVote.find({ user: userId, post: { $in: postIds } }),
      SavedPost.find({ user: userId, post: { $in: postIds } }),
    ]);

    likes.forEach((l) => (likedMap[l.post.toString()] = true));
    votes.forEach((v) => (voteMap[v.post.toString()] = v.voteType));
    saves.forEach((s) => (savedMap[s.post.toString()] = true));
  }

  return posts.map((post) => {
    const p = post.toObject ? post.toObject() : post;
    const authorId = p.author ? (p.author._id ? p.author._id.toString() : p.author.toString()) : null;
    return {
      ...p,
      isLiked: !!likedMap[p._id.toString()],
      userVote: voteMap[p._id.toString()] || 0,
      isSaved: !!savedMap[p._id.toString()],
      isAuthor: userId ? userId.toString() === authorId : false,
    };
  });
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { title, content, postType, mediaUrl, linkUrl, communityId, tags } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Post title is required' });
    }

    let community = null;
    if (communityId) {
      community = await Community.findById(communityId);
      if (!community) {
        return res.status(404).json({ success: false, message: 'Selected community not found' });
      }
    }

    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) parsedTags = tags;
      else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
      }
    }

    const post = await Post.create({
      title: title.trim(),
      content: content || '',
      postType: postType || 'text',
      mediaUrl: mediaUrl || '',
      linkUrl: linkUrl || '',
      author: req.user._id,
      community: community ? community._id : null,
      tags: parsedTags,
    });

    // Increment user postsCount
    await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });
    if (community) {
      await Community.findByIdAndUpdate(community._id, { $inc: { postsCount: 1 } });
    }

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon');

    const enriched = (await enrichPostsWithUserState([populatedPost], req.user._id))[0];

    res.status(201).json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get feed posts
// @route   GET /api/posts
// @access  Public (Optional Auth)
exports.getFeed = async (req, res) => {
  try {
    const { tab = 'for-you', page = 1, limit = 15, tag } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    let sort = { createdAt: -1 };

    if (tag) {
      query.tags = tag;
    }

    const currentUserId = req.user ? req.user._id : null;

    if (tab === 'following' && currentUserId) {
      const followings = await Follower.find({ follower: currentUserId });
      const followedUserIds = followings.map((f) => f.following);
      query.author = { $in: followedUserIds };
    } else if (tab === 'joined' && currentUserId) {
      const memberships = await CommunityMember.find({ user: currentUserId });
      const joinedCommunityIds = memberships.map((m) => m.community);
      query.community = { $in: joinedCommunityIds };
    } else if (tab === 'new') {
      sort = { createdAt: -1 };
    } else if (tab === 'top') {
      sort = { score: -1, createdAt: -1 };
    } else if (tab === 'popular') {
      sort = { score: -1, commentsCount: -1, createdAt: -1 };
    } else if (tab === 'for-you' && currentUserId) {
      // Personalized feed: combine followed users, joined communities, and popular posts
      const [followings, memberships] = await Promise.all([
        Follower.find({ follower: currentUserId }),
        CommunityMember.find({ user: currentUserId }),
      ]);
      const followedUserIds = followings.map((f) => f.following);
      const joinedCommunityIds = memberships.map((m) => m.community);

      // If user follows people or communities, include them preferentially
      if (followedUserIds.length > 0 || joinedCommunityIds.length > 0) {
        query = {
          $or: [
            { author: { $in: [...followedUserIds, currentUserId] } },
            { community: { $in: joinedCommunityIds } },
            { score: { $gte: 0 } },
          ],
        };
      }
      sort = { createdAt: -1 };
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const enriched = await enrichPostsWithUserState(posts, currentUserId);

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: enriched,
    });
  } catch (err) {
    console.error('Get feed error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public (Optional Auth)
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName avatar bio')
      .populate('community', 'name slug icon description memberCount rules');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const currentUserId = req.user ? req.user._id : null;
    const enriched = (await enrichPostsWithUserState([post], currentUserId))[0];

    res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Like / Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
exports.toggleLikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingLike = await PostLike.findOne({
      user: req.user._id,
      post: postId,
    });

    let isLiked = false;

    if (existingLike) {
      await PostLike.findByIdAndDelete(existingLike._id);
      post.likesCount = Math.max(0, post.likesCount - 1);
      isLiked = false;
    } else {
      await PostLike.create({
        user: req.user._id,
        post: postId,
      });
      post.likesCount += 1;
      isLiked = true;

      // Send notification if not liking own post
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'like_post',
          post: post._id,
          message: `${req.user.fullName} liked your post "${post.title.substring(0, 40)}..."`,
        });
      }
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: {
        isLiked,
        likesCount: post.likesCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Vote (Upvote / Downvote) on post
// @route   POST /api/posts/:id/vote
// @access  Private
exports.votePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { voteType } = req.body; // 1 (upvote) or -1 (downvote)

    if (![1, -1].includes(voteType)) {
      return res.status(400).json({ success: false, message: 'Invalid voteType. Must be 1 or -1' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingVote = await PostVote.findOne({
      user: req.user._id,
      post: postId,
    });

    let currentVote = 0;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off vote
        if (voteType === 1) post.upvotesCount = Math.max(0, post.upvotesCount - 1);
        if (voteType === -1) post.downvotesCount = Math.max(0, post.downvotesCount - 1);
        await PostVote.findByIdAndDelete(existingVote._id);
        currentVote = 0;
      } else {
        // Switch vote direction
        if (voteType === 1) {
          post.upvotesCount += 1;
          post.downvotesCount = Math.max(0, post.downvotesCount - 1);
        } else {
          post.downvotesCount += 1;
          post.upvotesCount = Math.max(0, post.upvotesCount - 1);
        }
        existingVote.voteType = voteType;
        await existingVote.save();
        currentVote = voteType;
      }
    } else {
      // New vote
      if (voteType === 1) {
        post.upvotesCount += 1;
        // Notification for upvote
        if (post.author.toString() !== req.user._id.toString()) {
          await Notification.create({
            recipient: post.author,
            sender: req.user._id,
            type: 'vote_post',
            post: post._id,
            message: `${req.user.fullName} upvoted your post "${post.title.substring(0, 40)}..."`,
          });
        }
      } else {
        post.downvotesCount += 1;
      }

      await PostVote.create({
        user: req.user._id,
        post: postId,
        voteType,
      });
      currentVote = voteType;
    }

    post.score = post.upvotesCount - post.downvotesCount;
    await post.save();

    res.status(200).json({
      success: true,
      data: {
        userVote: currentVote,
        score: post.score,
        upvotesCount: post.upvotesCount,
        downvotesCount: post.downvotesCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Save / Unsave post
// @route   POST /api/posts/:id/save
// @access  Private
exports.toggleSavePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingSave = await SavedPost.findOne({
      user: req.user._id,
      post: postId,
    });

    let isSaved = false;

    if (existingSave) {
      await SavedPost.findByIdAndDelete(existingSave._id);
      isSaved = false;
    } else {
      await SavedPost.create({
        user: req.user._id,
        post: postId,
      });
      isSaved = true;
    }

    res.status(200).json({
      success: true,
      data: { isSaved },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete post (author only)
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // 403 when deleting someone else's post
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post.',
      });
    }

    // Clean up related documents
    await Promise.all([
      PostLike.deleteMany({ post: post._id }),
      PostVote.deleteMany({ post: post._id }),
      SavedPost.deleteMany({ post: post._id }),
      Comment.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id }),
      Post.findByIdAndDelete(post._id),
      User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } }),
      post.community ? Community.findByIdAndUpdate(post.community, { $inc: { postsCount: -1 } }) : Promise.resolve(),
    ]);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
