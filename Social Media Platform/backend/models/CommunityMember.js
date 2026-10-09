const mongoose = require('mongoose');

const CommunityMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate memberships
CommunityMemberSchema.index({ user: 1, community: 1 }, { unique: true });

module.exports = mongoose.model('CommunityMember', CommunityMemberSchema);
