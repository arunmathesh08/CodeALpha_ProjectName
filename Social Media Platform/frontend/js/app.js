// =========================================================
// ConnectHub Main Feed Application Controller
// =========================================================

let currentFeedTab = 'for-you';
let currentTagFilter = null;
let activeCommunitiesList = [];

// Initialize Feed Application
document.addEventListener('DOMContentLoaded', async () => {
  // Check URL params for tag or tab
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tag')) {
    currentTagFilter = urlParams.get('tag');
  }
  if (urlParams.get('tab')) {
    currentFeedTab = urlParams.get('tab');
  }

  // Bind Navbar Global Search
  initNavbarSearch();

  // Bind Post Filter Tabs
  initFeedTabs();

  // Bind Create Post Modal & Live Previews
  initCreatePostModal();

  // Load Feed Data
  await loadFeedPosts();

  // Load Sidebar Widgets (Trending, Suggested, Communities)
  await loadSidebarWidgets();

  // Check and poll notifications badge
  initNotificationBadge();

  // Global event delegation for post and comment interactions
  initPostInteractions();
});

// Feed Tabs Handler
const initFeedTabs = () => {
  const tabBtns = document.querySelectorAll('.feed-tab-btn');
  tabBtns.forEach((btn) => {
    const tabName = btn.getAttribute('data-tab');
    if (tabName === currentFeedTab) {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentFeedTab = tabName;
      currentTagFilter = null;
      loadFeedPosts();
    });
  });
};

// Load Feed Posts
const loadFeedPosts = async () => {
  const feedContainer = document.getElementById('posts-feed-container');
  if (!feedContainer) return;

  feedContainer.innerHTML = `
    <div class="glass-card skeleton" style="height: 180px; margin-bottom: 1rem;"></div>
    <div class="glass-card skeleton" style="height: 220px; margin-bottom: 1rem;"></div>
    <div class="glass-card skeleton" style="height: 180px;"></div>
  `;

  try {
    const params = { tab: currentFeedTab };
    if (currentTagFilter) params.tag = currentTagFilter;

    const res = await API.getFeed(params);

    if (!res.success || !res.data || res.data.length === 0) {
      feedContainer.innerHTML = `
        <div class="glass-card" style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
          <i class="bi bi-inbox" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--accent-primary);"></i>
          <h3 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">No posts found</h3>
          <p style="font-size: 0.9rem;">${currentFeedTab === 'following' ? "You aren't following anyone with posts yet, or they haven't posted." : currentFeedTab === 'joined' ? "You haven't joined any communities with posts yet." : "Be the first to share something with the community!"}</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 1rem;" onclick="openCreatePostModal()">
            <i class="bi bi-plus-lg"></i> Create Post
          </button>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = res.data.map((post) => createPostCardHTML(post)).join('');
  } catch (err) {
    feedContainer.innerHTML = `
      <div class="glass-card" style="padding: 2rem; text-align: center; color: #ef4444;">
        <i class="bi bi-exclamation-triangle" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
        <p>Failed to load feed. ${err.message}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top: 0.75rem;" onclick="loadFeedPosts()">Try Again</button>
      </div>
    `;
  }
};

// Create Post Modal & Live Previews
let currentPostType = 'text';
let uploadedImageUrl = '';

const initCreatePostModal = () => {
  const modal = document.getElementById('create-post-modal');
  if (!modal) return;

  // Open triggers
  document.querySelectorAll('.open-create-post-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = window.getCurrentUser && window.getCurrentUser();
      if (!u) {
        window.openAuthModal('login');
        return;
      }
      openCreatePostModal();
    });
  });

  // Close triggers
  modal.querySelectorAll('.modal-close, .btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', closeCreatePostModal);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCreatePostModal();
  });

  // Type Tabs Switcher (Text, Image, Link)
  const typeTabs = modal.querySelectorAll('.post-type-tab');
  typeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      typeTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentPostType = tab.getAttribute('data-type');
      updatePostTypeFields();
      updateLivePreview();
    });
  });

  // File Upload Handler
  const fileInput = document.getElementById('post-image-file');
  if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const uploadStatus = document.getElementById('image-upload-status');
      if (uploadStatus) uploadStatus.textContent = 'Uploading image...';

      try {
        const res = await API.uploadImage(file);
        if (res.success && res.data.url) {
          uploadedImageUrl = res.data.url;
          const urlInput = document.getElementById('post-media-url');
          if (urlInput) urlInput.value = uploadedImageUrl;
          if (uploadStatus) uploadStatus.textContent = 'Image uploaded successfully!';
          updateLivePreview();
        }
      } catch (err) {
        showToast(err.message || 'Image upload failed', 'error');
        if (uploadStatus) uploadStatus.textContent = 'Upload failed.';
      }
    });
  }

  // Live input change listeners for preview
  ['post-title-input', 'post-content-input', 'post-media-url', 'post-link-url', 'post-tags-input', 'post-community-select'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateLivePreview);
      el.addEventListener('change', updateLivePreview);
    }
  });

  // Form Submit Handler
  const form = document.getElementById('create-post-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('post-title-input').value.trim();
      const content = document.getElementById('post-content-input').value.trim();
      const mediaUrl = document.getElementById('post-media-url').value.trim();
      const linkUrl = document.getElementById('post-link-url')?.value.trim();
      const communityId = document.getElementById('post-community-select')?.value;
      const tags = document.getElementById('post-tags-input')?.value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!title) {
        showToast('Please enter a post title', 'error');
        return;
      }

      try {
        if (submitBtn) submitBtn.disabled = true;
        const res = await API.createPost({
          title,
          content,
          postType: currentPostType,
          mediaUrl: currentPostType === 'image' || currentPostType === 'link' ? mediaUrl : '',
          linkUrl: currentPostType === 'link' ? linkUrl : '',
          communityId: communityId || null,
          tags,
        });

        if (res.success) {
          showToast('Post created successfully!', 'success');
          closeCreatePostModal();
          form.reset();
          uploadedImageUrl = '';
          // Prepend newly created post to feed
          const feedContainer = document.getElementById('posts-feed-container');
          if (feedContainer) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createPostCardHTML(res.data);
            feedContainer.prepend(tempDiv.firstElementChild);
          }
        }
      } catch (err) {
        showToast(err.message || 'Failed to create post', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
};

const openCreatePostModal = async () => {
  const modal = document.getElementById('create-post-modal');
  if (!modal) return;

  // Populate community dropdown if not populated
  const select = document.getElementById('post-community-select');
  if (select && select.options.length <= 1) {
    try {
      const res = await API.getAllCommunities({ limit: 50 });
      if (res.success && res.data) {
        activeCommunitiesList = res.data;
        res.data.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c._id;
          opt.textContent = `c/${c.name}`;
          select.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Could not populate communities select:', e);
    }
  }

  updatePostTypeFields();
  updateLivePreview();
  modal.classList.add('active');
};

const closeCreatePostModal = () => {
  const modal = document.getElementById('create-post-modal');
  if (modal) modal.classList.remove('active');
};

const updatePostTypeFields = () => {
  const imageField = document.getElementById('image-post-fields');
  const linkField = document.getElementById('link-post-fields');

  if (imageField) imageField.style.display = currentPostType === 'image' ? 'block' : 'none';
  if (linkField) linkField.style.display = currentPostType === 'link' ? 'block' : 'none';
};

const updateLivePreview = () => {
  const previewContainer = document.getElementById('post-live-preview-box');
  if (!previewContainer) return;

  const title = document.getElementById('post-title-input')?.value.trim() || 'Your Post Title Here';
  const content = document.getElementById('post-content-input')?.value.trim() || 'Your post description and thoughts will appear here in real-time...';
  const mediaUrl = document.getElementById('post-media-url')?.value.trim() || uploadedImageUrl;
  const linkUrl = document.getElementById('post-link-url')?.value.trim();
  const select = document.getElementById('post-community-select');
  const selectedCommName = select && select.selectedIndex > 0 ? select.options[select.selectedIndex].text : null;
  const user = window.getCurrentUser && window.getCurrentUser();

  const previewPost = {
    _id: 'preview',
    title,
    content,
    postType: currentPostType,
    mediaUrl,
    linkUrl,
    author: user || { fullName: 'You', username: 'you', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=you' },
    community: selectedCommName ? { name: selectedCommName.replace('c/', ''), slug: 'preview' } : null,
    score: 0,
    likesCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    isAuthor: true,
  };

  previewContainer.innerHTML = createPostCardHTML(previewPost);
};

// Post Interactions Delegation
const initPostInteractions = () => {
  document.addEventListener('click', async (e) => {
    const user = window.getCurrentUser && window.getCurrentUser();

    // 1. Voting (Upvote / Downvote)
    const voteBtn = e.target.closest('.vote-btn');
    if (voteBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const postId = voteBtn.getAttribute('data-post-id');
      const voteType = parseInt(voteBtn.getAttribute('data-type'), 10);
      const votePill = voteBtn.closest('.vote-pill');
      const scoreEl = votePill.querySelector('.vote-score');

      try {
        const res = await API.votePost(postId, voteType);
        if (res.success && res.data) {
          const { userVote, score } = res.data;
          scoreEl.textContent = score;

          const upBtn = votePill.querySelector('.vote-btn.upvote');
          const downBtn = votePill.querySelector('.vote-btn.downvote');

          upBtn.classList.toggle('active', userVote === 1);
          upBtn.querySelector('i').className = `bi bi-arrow-up-circle${userVote === 1 ? '-fill' : ''}`;

          downBtn.classList.toggle('active', userVote === -1);
          downBtn.querySelector('i').className = `bi bi-arrow-down-circle${userVote === -1 ? '-fill' : ''}`;

          votePill.className = `vote-pill ${userVote === 1 ? 'upvoted' : userVote === -1 ? 'downvoted' : ''}`;
        }
      } catch (err) {
        showToast(err.message || 'Voting failed', 'error');
      }
      return;
    }

    // 2. Liking Post
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const postId = likeBtn.getAttribute('data-post-id');
      const countEl = likeBtn.querySelector('.likes-count');

      try {
        const res = await API.toggleLikePost(postId);
        if (res.success && res.data) {
          const { isLiked, likesCount } = res.data;
          countEl.textContent = likesCount;
          likeBtn.classList.toggle('liked', isLiked);
          likeBtn.querySelector('i').className = `bi bi-heart${isLiked ? '-fill' : ''}`;
        }
      } catch (err) {
        showToast(err.message || 'Like action failed', 'error');
      }
      return;
    }

    // 3. Saving Post
    const saveBtn = e.target.closest('.save-btn');
    if (saveBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const postId = saveBtn.getAttribute('data-post-id');

      try {
        const res = await API.toggleSavePost(postId);
        if (res.success && res.data) {
          const { isSaved } = res.data;
          saveBtn.classList.toggle('saved', isSaved);
          saveBtn.querySelector('i').className = `bi bi-bookmark${isSaved ? '-fill' : ''}`;
          showToast(isSaved ? 'Post saved to your bookmarks' : 'Post removed from bookmarks', 'info');
        }
      } catch (err) {
        showToast(err.message || 'Save action failed', 'error');
      }
      return;
    }

    // 4. Share Post Link Copy
    const shareBtn = e.target.closest('.share-btn');
    if (shareBtn) {
      e.preventDefault();
      const postId = shareBtn.getAttribute('data-post-id');
      const url = `${window.location.origin}/index.html?post=${postId}`;
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
      }).catch(() => {
        showToast(`Post link: ${url}`, 'info');
      });
      return;
    }

    // 5. Delete Post
    const deletePostBtn = e.target.closest('.delete-post-btn');
    if (deletePostBtn) {
      e.preventDefault();
      const postId = deletePostBtn.getAttribute('data-post-id');
      if (confirm('Are you sure you want to permanently delete this post?')) {
        try {
          const res = await API.deletePost(postId);
          if (res.success) {
            showToast('Post deleted successfully', 'success');
            const card = document.getElementById(`post-${postId}`);
            if (card) {
              card.style.opacity = '0';
              card.style.transform = 'translateY(10px)';
              setTimeout(() => card.remove(), 250);
            }
          }
        } catch (err) {
          showToast(err.message || 'Delete failed', 'error');
        }
      }
      return;
    }

    // 6. Comments Drawer Toggle
    const commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) {
      e.preventDefault();
      const postId = commentBtn.getAttribute('data-post-id');
      const section = document.getElementById(`comments-section-${postId}`);
      if (section) {
        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'flex' : 'none';
        if (isHidden) {
          loadPostComments(postId);
        }
      }
      return;
    }

    // 7. Submit Top-Level Comment
    const submitCommentBtn = e.target.closest('.submit-comment-btn');
    if (submitCommentBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const postId = submitCommentBtn.getAttribute('data-post-id');
      const input = document.getElementById(`comment-input-${postId}`);
      const content = input ? input.value.trim() : '';

      if (!content) {
        showToast('Comment cannot be empty', 'error');
        return;
      }

      try {
        submitCommentBtn.disabled = true;
        const res = await API.createComment({ postId, content });
        if (res.success && res.data) {
          input.value = '';
          const tree = document.getElementById(`comments-tree-${postId}`);
          if (tree) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createCommentItemHTML(res.data, postId);
            tree.prepend(tempDiv.firstElementChild);
          }
          // Increment comment counter on post card
          const card = document.getElementById(`post-${postId}`);
          if (card) {
            const countEl = card.querySelector('.comments-count');
            if (countEl) countEl.textContent = parseInt(countEl.textContent, 10) + 1;
          }
          showToast('Comment posted', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Failed to post comment', 'error');
      } finally {
        submitCommentBtn.disabled = false;
      }
      return;
    }

    // 8. Comment Reply Toggle Trigger
    const replyToggleBtn = e.target.closest('.reply-toggle-btn');
    if (replyToggleBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const commentId = replyToggleBtn.getAttribute('data-comment-id');
      const container = document.getElementById(`reply-container-${commentId}`);
      if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
      }
      return;
    }

    // 9. Cancel Reply
    const cancelReplyBtn = e.target.closest('.cancel-reply-btn');
    if (cancelReplyBtn) {
      e.preventDefault();
      const commentId = cancelReplyBtn.getAttribute('data-comment-id');
      const container = document.getElementById(`reply-container-${commentId}`);
      if (container) container.style.display = 'none';
      return;
    }

    // 10. Submit Reply
    const submitReplyBtn = e.target.closest('.submit-reply-btn');
    if (submitReplyBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const commentId = submitReplyBtn.getAttribute('data-comment-id');
      const postId = submitReplyBtn.getAttribute('data-post-id');
      const input = document.getElementById(`reply-input-${commentId}`);
      const content = input ? input.value.trim() : '';

      if (!content) {
        showToast('Reply cannot be empty', 'error');
        return;
      }

      try {
        submitReplyBtn.disabled = true;
        const res = await API.createComment({
          postId,
          content,
          parentCommentId: commentId,
        });

        if (res.success && res.data) {
          input.value = '';
          const container = document.getElementById(`reply-container-${commentId}`);
          if (container) container.style.display = 'none';

          // Insert nested reply into comment item
          const parentItem = document.getElementById(`comment-${commentId}`);
          if (parentItem) {
            let nestedList = parentItem.querySelector('.nested-replies-list');
            if (!nestedList) {
              nestedList = document.createElement('div');
              nestedList.className = 'nested-replies-list';
              parentItem.appendChild(nestedList);
            }
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createCommentItemHTML(res.data, postId);
            nestedList.appendChild(tempDiv.firstElementChild);
          }

          // Increment count on post card
          const card = document.getElementById(`post-${postId}`);
          if (card) {
            const countEl = card.querySelector('.comments-count');
            if (countEl) countEl.textContent = parseInt(countEl.textContent, 10) + 1;
          }
          showToast('Reply posted', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Failed to post reply', 'error');
      } finally {
        submitReplyBtn.disabled = false;
      }
      return;
    }

    // 11. Like Comment
    const likeCommentBtn = e.target.closest('.like-comment-btn');
    if (likeCommentBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const commentId = likeCommentBtn.getAttribute('data-comment-id');
      const span = likeCommentBtn.querySelector('span');

      try {
        const res = await API.toggleLikeComment(commentId);
        if (res.success && res.data) {
          const { isLiked, likesCount } = res.data;
          if (span) span.textContent = likesCount;
          likeCommentBtn.classList.toggle('liked', isLiked);
          likeCommentBtn.querySelector('i').className = `bi bi-heart${isLiked ? '-fill' : ''}`;
        }
      } catch (err) {
        showToast(err.message || 'Like comment failed', 'error');
      }
      return;
    }

    // 12. Delete Comment (and its nested replies)
    const deleteCommentBtn = e.target.closest('.delete-comment-btn');
    if (deleteCommentBtn) {
      e.preventDefault();
      const commentId = deleteCommentBtn.getAttribute('data-comment-id');
      const postId = deleteCommentBtn.getAttribute('data-post-id');

      if (confirm('Are you sure you want to delete this comment? (Nested replies will also be deleted)')) {
        try {
          const res = await API.deleteComment(commentId);
          if (res.success) {
            const el = document.getElementById(`comment-${commentId}`);
            if (el) el.remove();

            // Refresh post comments count
            const card = document.getElementById(`post-${postId}`);
            if (card && res.deletedIds) {
              const countEl = card.querySelector('.comments-count');
              if (countEl) {
                const current = parseInt(countEl.textContent, 10) || 0;
                countEl.textContent = Math.max(0, current - res.deletedIds.length);
              }
            }
            showToast(res.message || 'Comment deleted', 'success');
          }
        } catch (err) {
          showToast(err.message || 'Delete comment failed', 'error');
        }
      }
      return;
    }

    // 13. Follow / Unfollow User Toggle in Widgets
    const followToggleBtn = e.target.closest('.follow-toggle-btn');
    if (followToggleBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const targetUserId = followToggleBtn.getAttribute('data-user-id');
      try {
        const res = await API.toggleFollow(targetUserId);
        if (res.success && res.data) {
          const { isFollowing } = res.data;
          followToggleBtn.textContent = isFollowing ? 'Following' : 'Follow';
          followToggleBtn.className = `btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'} follow-toggle-btn`;
          showToast(isFollowing ? 'Followed user' : 'Unfollowed user', 'info');
        }
      } catch (err) {
        showToast(err.message || 'Follow action failed', 'error');
      }
      return;
    }

    // 14. Join / Leave Community Toggle in Widgets
    const commJoinBtn = e.target.closest('.comm-join-toggle-btn');
    if (commJoinBtn) {
      e.preventDefault();
      if (!user) {
        window.openAuthModal('login');
        return;
      }
      const commId = commJoinBtn.getAttribute('data-comm-id');
      try {
        const res = await API.toggleJoinCommunity(commId);
        if (res.success && res.data) {
          const { isMember } = res.data;
          commJoinBtn.textContent = isMember ? 'Joined' : 'Join';
          commJoinBtn.className = `btn btn-sm ${isMember ? 'btn-secondary' : 'btn-outline'} comm-join-toggle-btn`;
          showToast(isMember ? 'Joined community' : 'Left community', 'info');
        }
      } catch (err) {
        showToast(err.message || 'Join community failed', 'error');
      }
      return;
    }
  });
};

// Load Threaded Comments for a Post
const loadPostComments = async (postId) => {
  const tree = document.getElementById(`comments-tree-${postId}`);
  if (!tree) return;

  try {
    const res = await API.getPostComments(postId);
    if (!res.success || !res.data || res.data.length === 0) {
      tree.innerHTML = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem 0; text-align: center;">
          No comments yet. Start the conversation!
        </div>
      `;
      return;
    }

    tree.innerHTML = res.data.map((c) => createCommentItemHTML(c, postId)).join('');
  } catch (err) {
    tree.innerHTML = `<div style="color: #ef4444; font-size: 0.85rem;">Failed to load comments.</div>`;
  }
};

// Load Sidebar Widgets (Trending Topics, Suggested Users, Top Communities)
const loadSidebarWidgets = async () => {
  // 1. Trending Topics
  const trendingContainer = document.getElementById('trending-topics-widget');
  if (trendingContainer) {
    try {
      const res = await API.getTrending();
      if (res.success && res.data && res.data.topics) {
        trendingContainer.innerHTML = res.data.topics.slice(0, 5).map((t) => `
          <div class="trending-topic-item" onclick="window.location.href='/index.html?tag=${encodeURIComponent(t.tag)}'">
            <span class="topic-tag">Trending Topic</span>
            <span class="topic-name">#${escapeHTML(t.tag)}</span>
            <span class="topic-count">${t.postCount} posts</span>
          </div>
        `).join('');
      }
    } catch (e) {
      console.warn('Trending widget error:', e);
    }
  }

  // 2. Suggested Users
  const suggestedContainer = document.getElementById('suggested-users-widget');
  if (suggestedContainer) {
    try {
      const res = await API.getSuggestedUsers();
      if (res.success && res.data && res.data.length > 0) {
        suggestedContainer.innerHTML = res.data.slice(0, 4).map((u) => createUserCardHTML(u)).join('');
      } else {
        suggestedContainer.innerHTML = '<div style="font-size:0.85rem;color:var(--text-muted);">No new suggestions right now.</div>';
      }
    } catch (e) {
      console.warn('Suggested users widget error:', e);
    }
  }

  // 3. Top Communities for Left & Right sidebars
  const topCommsWidget = document.getElementById('top-communities-widget');
  const leftCommsList = document.getElementById('left-communities-list');

  try {
    const res = await API.getAllCommunities({ limit: 6 });
    if (res.success && res.data) {
      if (topCommsWidget) {
        topCommsWidget.innerHTML = res.data.slice(0, 4).map((c) => createCommunityCardHTML(c)).join('');
      }
      if (leftCommsList) {
        leftCommsList.innerHTML = res.data.map((c) => `
          <a href="/community.html?c=${escapeHTML(c.slug)}" class="community-pill-item">
            <img src="${c.icon || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(c.name)}" class="community-pill-icon" />
            <span>c/${escapeHTML(c.name)}</span>
          </a>
        `).join('');
      }
    }
  } catch (e) {
    console.warn('Top communities widget error:', e);
  }
};

// Navbar Search Dropdown & Debounce
const initNavbarSearch = () => {
  const input = document.getElementById('nav-search-input');
  const dropdown = document.getElementById('nav-search-dropdown');
  if (!input || !dropdown) return;

  let timeout = null;

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    const query = input.value.trim();

    if (query.length < 2) {
      dropdown.classList.remove('show');
      return;
    }

    timeout = setTimeout(async () => {
      try {
        const res = await API.search(query, 'all');
        if (res.success && res.data) {
          const { users, posts, communities } = res.data;
          let html = '';

          if (communities.length > 0) {
            html += `<div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);padding:0.4rem 0.6rem;text-transform:uppercase;">Communities</div>`;
            communities.slice(0, 3).forEach((c) => {
              html += `
                <a href="/community.html?c=${c.slug}" class="dropdown-item">
                  <img src="${c.icon}" style="width:20px;height:20px;border-radius:4px;" />
                  <span>c/${escapeHTML(c.name)}</span>
                </a>
              `;
            });
          }

          if (users.length > 0) {
            html += `<div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);padding:0.4rem 0.6rem;text-transform:uppercase;">Users</div>`;
            users.slice(0, 3).forEach((u) => {
              html += `
                <a href="/profile.html?u=${u.username}" class="dropdown-item">
                  <img src="${u.avatar}" style="width:20px;height:20px;border-radius:50%;" />
                  <span>${escapeHTML(u.fullName)} (@${escapeHTML(u.username)})</span>
                </a>
              `;
            });
          }

          if (posts.length > 0) {
            html += `<div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);padding:0.4rem 0.6rem;text-transform:uppercase;">Posts</div>`;
            posts.slice(0, 3).forEach((p) => {
              html += `
                <a href="/index.html?post=${p._id}" class="dropdown-item" style="font-size:0.85rem;">
                  <i class="bi bi-file-text"></i>
                  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHTML(p.title)}</span>
                </a>
              `;
            });
          }

          html += `
            <div class="dropdown-divider"></div>
            <a href="/search.html?q=${encodeURIComponent(query)}" class="dropdown-item" style="color:var(--accent-primary);font-weight:600;justify-content:center;">
              View all results for "${escapeHTML(query)}"
            </a>
          `;

          dropdown.innerHTML = html;
          dropdown.classList.add('show');
        }
      } catch (e) {
        console.warn('Search dropdown error:', e);
      }
    }, 250);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) window.location.href = `/search.html?q=${encodeURIComponent(q)}`;
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
};

// Notification Unread Badge Polling
const initNotificationBadge = async () => {
  const updateBadge = async () => {
    const user = window.getCurrentUser && window.getCurrentUser();
    if (!user) return;
    try {
      const res = await API.getNotifications({ filter: 'unread' });
      if (res.success) {
        const badgeEls = document.querySelectorAll('.notification-unread-badge');
        badgeEls.forEach((b) => {
          if (res.unreadCount > 0) {
            b.textContent = res.unreadCount > 99 ? '99+' : res.unreadCount;
            b.style.display = 'flex';
          } else {
            b.style.display = 'none';
          }
        });
      }
    } catch (e) {}
  };

  updateBadge();
  setInterval(updateBadge, 25000);
};

window.openCreatePostModal = openCreatePostModal;
window.closeCreatePostModal = closeCreatePostModal;
window.loadFeedPosts = loadFeedPosts;
