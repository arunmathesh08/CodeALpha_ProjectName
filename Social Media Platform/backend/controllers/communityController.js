const Community = require('../models/Community');
const CommunityMember = require('../models/CommunityMember');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostVote = require('../models/PostVote');
const SavedPost = require('../models/SavedPost');

// Helper to enrich posts with current user's interaction state
const enrichPosts = async (posts, userId) => {
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

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res) => {
  try {
    const { name, description, category, icon, banner, rules } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Community name is required' });
    }

    const existing = await Community.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A community with this name already exists',
      });
    }

    const defaultIcon = icon || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name.trim())}`;
    const defaultBanner = banner || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80';

    const community = await Community.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category || 'General',
      icon: defaultIcon,
      banner: defaultBanner,
      creator: req.user._id,
      rules: rules || [
        { title: 'Be Respectful', description: 'Treat fellow members with kindness and respect.' },
        { title: 'No Spam', description: 'Self-promotion and spam will be removed immediately.' },
        { title: 'Stay on Topic', description: 'Ensure posts are relevant to this community.' },
      ],
      memberCount: 1,
    });

    // Add creator as admin member
    await CommunityMember.create({
      user: req.user._id,
      community: community._id,
      role: 'admin',
    });

    res.status(201).json({
      success: true,
      data: community,
    });
  } catch (err) {
    console.error('Create community error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all communities (browse / search / category filter)
// @route   GET /api/communities
// @access  Public (Optional Auth)
exports.getAllCommunities = async (req, res) => {
  try {
    const { search, category, sort = 'popular', limit = 30 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = { $regex: category, $options: 'i' };
    }

    let sortObj = { memberCount: -1 };
    if (sort === 'new') sortObj = { createdAt: -1 };
    if (sort === 'name') sortObj = { name: 1 };
    if (sort === 'posts') sortObj = { postsCount: -1 };

    const communities = await Community.find(query)
      .populate('creator', 'username fullName avatar')
      .sort(sortObj)
      .limit(parseInt(limit, 10));

    let joinedIds = [];
    if (req.user) {
      const myMemberships = await CommunityMember.find({ user: req.user._id });
      joinedIds = myMemberships.map((m) => m.community.toString());
    }

    const data = communities.map((c) => {
      const obj = c.toObject();
      obj.isMember = joinedIds.includes(c._id.toString());
      return obj;
    });

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get community by slug or id
// @route   GET /api/communities/:slug
// @access  Public (Optional Auth)
exports.getCommunityBySlug = async (req, res) => {
  try {
    const param = req.params.slug.toLowerCase();
    let community = await Community.findOne({ slug: param }).populate(
      'creator',
      'username fullName avatar'
    );

    if (!community && param.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(param).populate('creator', 'username fullName avatar');
    }

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // Dynamic count update
    const memberCount = await CommunityMember.countDocuments({ community: community._id });
    const postsCount = await Post.countDocuments({ community: community._id });

    let isMember = false;
    let memberRole = null;

    if (req.user) {
      const membership = await CommunityMember.findOne({
        user: req.user._id,
        community: community._id,
      });
      if (membership) {
        isMember = true;
        memberRole = membership.role;
      }
    }

    const commObj = community.toObject();
    commObj.memberCount = memberCount;
    commObj.postsCount = postsCount;
    commObj.isMember = isMember;
    commObj.memberRole = memberRole;

    res.status(200).json({
      success: true,
      data: commObj,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get community posts by tab (posts, popular, new, top)
// @route   GET /api/communities/:slug/posts
// @access  Public (Optional Auth)
exports.getCommunityPosts = async (req, res) => {
  try {
    const param = req.params.slug.toLowerCase();
    let community = await Community.findOne({ slug: param });
    if (!community && param.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(param);
    }

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const { tab = 'posts', page = 1, limit = 15 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    let sort = { createdAt: -1 };
    if (tab === 'popular') sort = { score: -1, commentsCount: -1, createdAt: -1 };
    if (tab === 'new') sort = { createdAt: -1 };
    if (tab === 'top') sort = { score: -1, createdAt: -1 };

    const total = await Post.countDocuments({ community: community._id });
    const posts = await Post.find({ community: community._id })
      .populate('author', 'username fullName avatar')
      .populate('community', 'name slug icon')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const enriched = await enrichPosts(posts, req.user ? req.user._id : null);

    res.status(200).json({
      success: true,
      count: enriched.length,
      total,
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Join / Leave community
// @route   POST /api/communities/:id/join
// @access  Private
exports.toggleJoinCommunity = async (req, res) => {
  try {
    const communityId = req.params.id;
    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const existing = await CommunityMember.findOne({
      user: req.user._id,
      community: communityId,
    });

    let isMember = false;

    if (existing) {
      // Leave
      await CommunityMember.findByIdAndDelete(existing._id);
      community.memberCount = Math.max(0, community.memberCount - 1);
      isMember = false;
    } else {
      // Join
      await CommunityMember.create({
        user: req.user._id,
        community: communityId,
        role: 'member',
      });
      community.memberCount += 1;
      isMember = true;
    }

    await community.save();

    res.status(200).json({
      success: true,
      data: {
        isMember,
        memberCount: community.memberCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get members of a community
// @route   GET /api/communities/:slug/members
// @access  Public
exports.getCommunityMembers = async (req, res) => {
  try {
    const param = req.params.slug.toLowerCase();
    let community = await Community.findOne({ slug: param });
    if (!community && param.match(/^[0-9a-fA-F]{24}$/)) {
      community = await Community.findById(param);
    }

    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const members = await CommunityMember.find({ community: community._id })
      .populate('user', 'username fullName avatar bio location')
      .sort({ createdAt: -1 })
      .limit(50);

    const data = members.map((m) => ({
      ...m.user.toObject(),
      role: m.role,
      joinedAt: m.createdAt,
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
