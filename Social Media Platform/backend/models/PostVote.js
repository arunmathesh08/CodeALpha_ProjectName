const mongoose = require('mongoose');

const PostVoteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    voteType: {
      type: Number,
      enum: [1, -1], // 1 = Upvote, -1 = Downvote
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent multiple vote records per user/post
PostVoteSchema.index({ user: 1, post: 1 }, { unique: true });

module.exports = mongoose.model('PostVote', PostVoteSchema);
