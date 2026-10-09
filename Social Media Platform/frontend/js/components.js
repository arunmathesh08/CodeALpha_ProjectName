// =========================================================
// ConnectHub Reusable UI Component Generators
// =========================================================

// Time formatting helper
const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

// Safe string escape helper
const escapeHTML = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Generate Post Card HTML
const createPostCardHTML = (post) => {
  const author = post.author || {};
  const community = post.community || null;
  const authorAvatar = author.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author.username || 'user')}`;
  const authorName = escapeHTML(author.fullName || 'Anonymous');
  const authorUsername = escapeHTML(author.username || 'anonymous');
  const timeAgo = formatTimeAgo(post.createdAt);

  const isUpvoted = post.userVote === 1;
  const isDownvoted = post.userVote === -1;
  const isLiked = !!post.isLiked;
  const isSaved = !!post.isSaved;
  const isAuthor = !!post.isAuthor;

  let mediaHTML = '';
  if (post.postType === 'image' && post.mediaUrl) {
    mediaHTML = `
      <div class="post-media-container">
        <img src="${escapeHTML(post.mediaUrl)}" alt="${escapeHTML(post.title)}" loading="lazy" />
      </div>
    `;
  } else if (post.postType === 'link' && post.linkUrl) {
    mediaHTML = `
      <a href="${escapeHTML(post.linkUrl)}" target="_blank" rel="noopener noreferrer" class="post-link-card">
        <div class="post-link-icon">
          <i class="bi bi-link-45deg"></i>
        </div>
        <div class="post-link-info">
          <div class="post-link-url">${escapeHTML(post.linkUrl)}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="bi bi-box-arrow-up-right"></i> Open external link</div>
        </div>
      </a>
    `;
    if (post.mediaUrl) {
      mediaHTML += `
        <div class="post-media-container" style="margin-top:0.6rem;">
          <img src="${escapeHTML(post.mediaUrl)}" alt="${escapeHTML(post.title)}" loading="lazy" />
        </div>
      `;
    }
  }

  // Tags HTML
  let tagsHTML = '';
  if (post.tags && post.tags.length > 0) {
    tagsHTML = `
      <div class="post-tags-list">
        ${post.tags.map((t) => `<a href="/index.html?tag=${encodeURIComponent(t)}" class="post-tag">#${escapeHTML(t)}</a>`).join('')}
      </div>
    `;
  }

  return `
    <article class="glass-card post-card" id="post-${post._id}" data-post-id="${post._id}">
      <!-- Post Header -->
      <header class="post-header">
        <div class="post-meta-group">
          <a href="/profile.html?u=${authorUsername}">
            <img src="${authorAvatar}" alt="${authorName}" class="avatar-img" />
          </a>
          <div class="post-author-info">
            <div class="post-author-line">
              <a href="/profile.html?u=${authorUsername}" style="font-weight:700;">${authorName}</a>
              ${
                community
                  ? `<span style="color:var(--text-muted);font-size:0.8rem;">in</span>
                     <a href="/community.html?c=${community.slug}" class="post-community-badge">
                       <i class="bi bi-people-fill"></i> c/${escapeHTML(community.name)}
                     </a>`
                  : ''
              }
            </div>
            <div class="post-author-username">
              <a href="/profile.html?u=${authorUsername}">@${authorUsername}</a> • <span class="post-time">${timeAgo}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.3rem;">
          ${
            isAuthor
              ? `<button class="post-more-btn delete-post-btn" data-post-id="${post._id}" title="Delete Post">
                   <i class="bi bi-trash3"></i>
                 </button>`
              : ''
          }
        </div>
      </header>

      <!-- Post Body -->
      <div class="post-body">
        <h2 class="post-title">${escapeHTML(post.title)}</h2>
        ${post.content ? `<div class="post-text-content">${escapeHTML(post.content)}</div>` : ''}
        ${mediaHTML}
        ${tagsHTML}
      </div>

      <!-- Post Footer & Interactions -->
      <footer class="post-footer">
        <div class="post-actions-left">
          <!-- Reddit Voting Pill -->
          <div class="vote-pill ${isUpvoted ? 'upvoted' : isDownvoted ? 'downvoted' : ''}" data-post-id="${post._id}">
            <button class="vote-btn upvote ${isUpvoted ? 'active' : ''}" data-post-id="${post._id}" data-type="1" title="Upvote">
              <i class="bi bi-arrow-up-circle${isUpvoted ? '-fill' : ''}"></i>
            </button>
            <span class="vote-score">${post.score || 0}</span>
            <button class="vote-btn downvote ${isDownvoted ? 'active' : ''}" data-post-id="${post._id}" data-type="-1" title="Downvote">
              <i class="bi bi-arrow-down-circle${isDownvoted ? '-fill' : ''}"></i>
            </button>
          </div>

          <!-- Like Button -->
          <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}" title="Like">
            <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i>
            <span class="likes-count">${post.likesCount || 0}</span>
          </button>

          <!-- Comment Drawer Toggle Button -->
          <button class="action-btn comment-btn" data-post-id="${post._id}" title="Comments">
            <i class="bi bi-chat-text"></i>
            <span class="comments-count">${post.commentsCount || 0}</span>
          </button>
        </div>

        <div class="post-actions-right" style="display: flex; align-items: center; gap: 0.4rem;">
          <!-- Share Link -->
          <button class="action-btn share-btn" data-post-id="${post._id}" title="Copy Link">
            <i class="bi bi-share"></i>
          </button>
          <!-- Save Post Bookmark -->
          <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" data-post-id="${post._id}" title="Save Post">
            <i class="bi bi-bookmark${isSaved ? '-fill' : ''}"></i>
          </button>
        </div>
      </footer>

      <!-- Collapsible Threaded Comments Container -->
      <div class="comments-section" id="comments-section-${post._id}" style="display: none;">
        <!-- New Comment Input Box -->
        <div class="comment-input-box">
          <img src="${(window.getCurrentUser && window.getCurrentUser()?.avatar) || 'https://api.dicebear.com/7.x/bottts/svg?seed=guest'}" alt="avatar" class="avatar-img avatar-sm current-user-avatar" />
          <div class="comment-textarea-wrap">
            <textarea class="form-control comment-textarea" placeholder="Write a thoughtful comment..." id="comment-input-${post._id}"></textarea>
            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-primary btn-sm submit-comment-btn" data-post-id="${post._id}">
                <i class="bi bi-send"></i> Comment
              </button>
            </div>
          </div>
        </div>

        <!-- Threaded Comments Tree -->
        <div class="comments-tree" id="comments-tree-${post._id}">
          <div class="skeleton" style="height: 40px; margin-top: 0.5rem;"></div>
        </div>
      </div>
    </article>
  `;
};

// Generate Threaded Comment Tree HTML Recursively
const createCommentItemHTML = (comment, postId) => {
  const author = comment.author || {};
  const authorAvatar = author.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author.username || 'user')}`;
  const authorName = escapeHTML(author.fullName || 'Anonymous');
  const authorUsername = escapeHTML(author.username || 'anonymous');
  const timeAgo = formatTimeAgo(comment.createdAt);
  const isAuthor = !!comment.isAuthor;
  const isLiked = !!comment.isLiked;

  let repliesHTML = '';
  if (comment.replies && comment.replies.length > 0) {
    repliesHTML = `
      <div class="nested-replies-list">
        ${comment.replies.map((r) => createCommentItemHTML(r, postId)).join('')}
      </div>
    `;
  }

  return `
    <div class="comment-item ${comment.depth > 0 ? 'has-parent' : ''}" id="comment-${comment._id}" data-comment-id="${comment._id}">
      <div class="comment-header">
        <div class="comment-author-group">
          <a href="/profile.html?u=${authorUsername}">
            <img src="${authorAvatar}" alt="${authorName}" class="avatar-img avatar-sm" />
          </a>
          <a href="/profile.html?u=${authorUsername}" class="comment-author-name">${authorName}</a>
          <span class="comment-time">${timeAgo}</span>
        </div>

        ${
          isAuthor
            ? `<button class="comment-action-link delete-link delete-comment-btn" data-comment-id="${comment._id}" data-post-id="${postId}" title="Delete comment">
                 <i class="bi bi-trash3"></i>
               </button>`
            : ''
        }
      </div>

      <div class="comment-body">
        ${escapeHTML(comment.content)}
      </div>

      <div class="comment-actions">
        <!-- Like Comment -->
        <button class="comment-action-link ${isLiked ? 'liked' : ''} like-comment-btn" data-comment-id="${comment._id}">
          <i class="bi bi-heart${isLiked ? '-fill' : ''}"></i>
          <span>${comment.likesCount || 0}</span>
        </button>

        <!-- Reply Trigger -->
        <button class="comment-action-link reply-toggle-btn" data-comment-id="${comment._id}" data-post-id="${postId}">
          <i class="bi bi-reply"></i> Reply
        </button>
      </div>

      <!-- Hidden Inline Reply Box Container -->
      <div class="reply-input-container" id="reply-container-${comment._id}" style="display: none;">
        <div style="display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.4rem;">
          <textarea class="form-control" rows="2" placeholder="Replying to @${authorUsername}..." id="reply-input-${comment._id}" style="font-size:0.85rem;min-height:50px;"></textarea>
          <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
            <button class="btn btn-secondary btn-sm cancel-reply-btn" data-comment-id="${comment._id}">Cancel</button>
            <button class="btn btn-primary btn-sm submit-reply-btn" data-comment-id="${comment._id}" data-post-id="${postId}">Reply</button>
          </div>
        </div>
      </div>

      <!-- Nested Sub-Replies -->
      ${repliesHTML}
    </div>
  `;
};

// Generate User Card for Suggested / Search
const createUserCardHTML = (user) => {
  const avatar = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;
  const isFollowing = !!user.isFollowing;
  const isSelf = !!user.isSelf;

  return `
    <div class="user-card-item" id="user-card-${user._id}">
      <a href="/profile.html?u=${escapeHTML(user.username)}" class="user-card-info">
        <img src="${avatar}" alt="${escapeHTML(user.fullName)}" class="avatar-img" />
        <div class="user-card-names">
          <span class="user-card-fullname">${escapeHTML(user.fullName)}</span>
          <span class="user-card-username">@${escapeHTML(user.username)}</span>
        </div>
      </a>
      ${
        !isSelf
          ? `<button class="btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'} follow-toggle-btn" data-user-id="${user._id}">
               ${isFollowing ? 'Following' : 'Follow'}
             </button>`
          : ''
      }
    </div>
  `;
};

// Generate Community Card for Sidebar / Browse
const createCommunityCardHTML = (community) => {
  const icon = community.icon || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(community.name)}`;
  const isMember = !!community.isMember;

  return `
    <div class="user-card-item" id="comm-card-${community._id}">
      <a href="/community.html?c=${escapeHTML(community.slug)}" class="user-card-info">
        <img src="${icon}" alt="${escapeHTML(community.name)}" class="community-pill-icon" />
        <div class="user-card-names">
          <span class="user-card-fullname">c/${escapeHTML(community.name)}</span>
          <span class="user-card-username">${community.memberCount || 1} members</span>
        </div>
      </a>
      <button class="btn btn-sm ${isMember ? 'btn-secondary' : 'btn-outline'} comm-join-toggle-btn" data-comm-id="${community._id}">
        ${isMember ? 'Joined' : 'Join'}
      </button>
    </div>
  `;
};

window.formatTimeAgo = formatTimeAgo;
window.escapeHTML = escapeHTML;
window.createPostCardHTML = createPostCardHTML;
window.createCommentItemHTML = createCommentItemHTML;
window.createUserCardHTML = createUserCardHTML;
window.createCommunityCardHTML = createCommunityCardHTML;
