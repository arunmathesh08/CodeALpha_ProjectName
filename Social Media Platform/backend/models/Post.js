const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    content: {
      type: String,
      default: '',
      maxlength: [10000, 'Content cannot exceed 10000 characters'],
    },
    postType: {
      type: String,
      enum: ['text', 'image', 'link'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
    },
    upvotesCount: {
      type: Number,
      default: 0,
    },
    downvotesCount: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0, // upvotesCount - downvotesCount
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for feed query optimization
PostSchema.index({ createdAt: -1 });
PostSchema.index({ score: -1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ community: 1, createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
