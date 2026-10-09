const Comment = require('../models/Comment');
const CommentLike = require('../models/CommentLike');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// Helper to recursively find all descendant comment IDs for deletion
const getDescendantCommentIds = async (commentId) => {
  let ids = [commentId];
  const children = await Comment.find({ parentComment: commentId });
  for (const child of children) {
    const childIds = await getDescendantCommentIds(child._id);
    ids = ids.concat(childIds);
  }
  return ids;
};

// @desc    Create comment or reply
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    if (!postId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and comment content are required',
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    let depth = 0;
    let parentComment = null;

    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Parent comment not found' });
      }
      depth = (parentComment.depth || 0) + 1;
      parentComment.repliesCount += 1;
      await parentComment.save();
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content: content.trim(),
      parentComment: parentCommentId || null,
      depth,
    });

    // Increment commentsCount on Post
    post.commentsCount += 1;
    await post.save();

    // Populate author
    const populated = await Comment.findById(comment._id).populate(
      'author',
      'username fullName avatar'
    );

    // Notifications
    if (parentComment) {
      if (parentComment.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: parentComment.author,
          sender: req.user._id,
          type: 'reply_comment',
          post: post._id,
          comment: comment._id,
          message: `${req.user.fullName} replied to your comment: "${content.trim().substring(0, 40)}..."`,
        });
      }
    } else {
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: post.author,
          sender: req.user._id,
          type: 'comment_post',
          post: post._id,
          comment: comment._id,
          message: `${req.user.fullName} commented on your post: "${content.trim().substring(0, 40)}..."`,
        });
      }
    }

    const commentObj = populated.toObject();
    commentObj.isLiked = false;
    commentObj.isAuthor = true;
    commentObj.replies = [];

    res.status(201).json({
      success: true,
      data: commentObj,
    });
  } catch (err) {
    console.error('Create comment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get threaded comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public (Optional Auth)
exports.getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: 1 });

    const currentUserId = req.user ? req.user._id.toString() : null;
    let likedCommentIds = [];

    if (currentUserId) {
      const commentIds = comments.map((c) => c._id);
      const likes = await CommentLike.find({
        user: currentUserId,
        comment: { $in: commentIds },
      });
      likedCommentIds = likes.map((l) => l.comment.toString());
    }

    // Build threaded tree
    const commentMap = {};
    const rootComments = [];

    comments.forEach((c) => {
      const obj = c.toObject();
      obj.isLiked = likedCommentIds.includes(c._id.toString());
      obj.isAuthor = currentUserId === (c.author ? c.author._id.toString() : null);
      obj.replies = [];
      commentMap[c._id.toString()] = obj;
    });

    comments.forEach((c) => {
      const obj = commentMap[c._id.toString()];
      if (c.parentComment) {
        const parent = commentMap[c.parentComment.toString()];
        if (parent) {
          parent.replies.push(obj);
        } else {
          rootComments.push(obj);
        }
      } else {
        rootComments.push(obj);
      }
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: rootComments,
    });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Like / Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
exports.toggleLikeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const existing = await CommentLike.findOne({
      user: req.user._id,
      comment: commentId,
    });

    let isLiked = false;

    if (existing) {
      await CommentLike.findByIdAndDelete(existing._id);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
      isLiked = false;
    } else {
      await CommentLike.create({
        user: req.user._id,
        comment: commentId,
      });
      comment.likesCount += 1;
      isLiked = true;

      if (comment.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: comment.author,
          sender: req.user._id,
          type: 'like_comment',
          post: comment.post,
          comment: comment._id,
          message: `${req.user.fullName} liked your comment.`,
        });
      }
    }

    await comment.save();

    res.status(200).json({
      success: true,
      data: {
        isLiked,
        likesCount: comment.likesCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete comment (and its nested replies)
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // 403 when deleting someone else's comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment.',
      });
    }

    // Get all descendant comment IDs (including this one)
    const allCommentIdsToDelete = await getDescendantCommentIds(comment._id);
    const deleteCount = allCommentIdsToDelete.length;

    // Delete all likes & notifications on these comments
    await CommentLike.deleteMany({ comment: { $in: allCommentIdsToDelete } });
    await Notification.deleteMany({ comment: { $in: allCommentIdsToDelete } });
    await Comment.deleteMany({ _id: { $in: allCommentIdsToDelete } });

    // Decrement post commentsCount
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -deleteCount },
    });

    // If it had a parent, decrement parent's repliesCount
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $inc: { repliesCount: -1 },
      });
    }

    res.status(200).json({
      success: true,
      message: `Comment and its ${deleteCount - 1} replies deleted successfully.`,
      deletedIds: allCommentIdsToDelete,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
