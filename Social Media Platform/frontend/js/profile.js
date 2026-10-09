// =========================================================
// ConnectHub Profile Page Controller
// =========================================================

let targetUsername = '';
let activeProfileTab = 'posts';
let profileUserData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  targetUsername = urlParams.get('u');

  // If no username specified, redirect to current logged in user or alexkumar
  if (!targetUsername) {
    const user = window.getCurrentUser && window.getCurrentUser();
    targetUsername = user ? user.username : 'alexkumar';
  }

  // Bind tabs
  initProfileTabs();

  // Bind Edit Profile Modal
  initEditProfileModal();

  // Load Profile Information
  await loadProfile();

  // Load Tab Content
  await loadProfileTabContent();
});

const initProfileTabs = () => {
  const tabBtns = document.querySelectorAll('.profile-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeProfileTab = btn.getAttribute('data-tab');
      loadProfileTabContent();
    });
  });
};

const loadProfile = async () => {
  const headerContainer = document.getElementById('profile-header-container');
  if (!headerContainer) return;

  try {
    const res = await API.getUserProfile(targetUsername);
    if (!res.success || !res.data) {
      headerContainer.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;">User not found</div>`;
      return;
    }

    profileUserData = res.data;
    const user = profileUserData;
    const isSelf = !!user.isSelf;
    const isFollowing = !!user.isFollowing;
    const joinedDate = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    headerContainer.innerHTML = `
      <div class="glass-card profile-card">
        <img src="${user.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}" alt="Cover" class="profile-cover" />
        
        <div class="profile-details-wrap">
          <div class="profile-avatar-row">
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(user.username)}" alt="${escapeHTML(user.fullName)}" class="profile-avatar-img" />
            <div style="display:flex; gap:0.6rem;">
              ${
                isSelf
                  ? `<button class="btn btn-secondary btn-sm" onclick="openEditProfileModal()">
                       <i class="bi bi-pencil-square"></i> Edit Profile
                     </button>`
                  : `<button class="btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}" id="profile-follow-toggle-btn" data-user-id="${user._id}">
                       <i class="bi bi-person-${isFollowing ? 'check' : 'plus'}"></i> ${isFollowing ? 'Following' : 'Follow'}
                     </button>`
              }
            </div>
          </div>

          <div class="profile-names">
            <h1 class="profile-fullname">${escapeHTML(user.fullName)}</h1>
            <span class="profile-username">@${escapeHTML(user.username)}</span>
          </div>

          ${user.bio ? `<p class="profile-bio">${escapeHTML(user.bio)}</p>` : ''}

          <div class="profile-meta-row">
            ${user.location ? `<div class="profile-meta-item"><i class="bi bi-geo-alt-fill"></i> ${escapeHTML(user.location)}</div>` : ''}
            <div class="profile-meta-item"><i class="bi bi-calendar3"></i> Joined ${joinedDate}</div>
          </div>

          <div class="profile-stats-row">
            <div class="profile-stat" style="cursor:pointer;" onclick="openFollowModal('followers')">
              <span class="profile-stat-count" id="profile-followers-count">${user.followersCount || 0}</span> Followers
            </div>
            <div class="profile-stat" style="cursor:pointer;" onclick="openFollowModal('following')">
              <span class="profile-stat-count" id="profile-following-count">${user.followingCount || 0}</span> Following
            </div>
            <div class="profile-stat">
              <span class="profile-stat-count">${user.postsCount || 0}</span> Posts
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Follow toggle on profile
    const followBtn = document.getElementById('profile-follow-toggle-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        const currentUser = window.getCurrentUser && window.getCurrentUser();
        if (!currentUser) {
          window.openAuthModal('login');
          return;
        }

        try {
          const res = await API.toggleFollow(user._id);
          if (res.success && res.data) {
            const { isFollowing: nowFollowing, followersCount } = res.data;
            followBtn.innerHTML = `<i class="bi bi-person-${nowFollowing ? 'check' : 'plus'}"></i> ${nowFollowing ? 'Following' : 'Follow'}`;
            followBtn.className = `btn btn-sm ${nowFollowing ? 'btn-secondary' : 'btn-primary'}`;
            const countEl = document.getElementById('profile-followers-count');
            if (countEl) countEl.textContent = followersCount;
            showToast(nowFollowing ? 'Followed user' : 'Unfollowed user', 'info');
          }
        } catch (err) {
          showToast(err.message || 'Follow action failed', 'error');
        }
      });
    }
  } catch (err) {
    headerContainer.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;color:#ef4444;">Error loading profile: ${err.message}</div>`;
  }
};

const loadProfileTabContent = async () => {
  const container = document.getElementById('profile-tab-content');
  if (!container) return;

  container.innerHTML = `<div class="glass-card skeleton" style="height: 160px; margin-bottom: 1rem;"></div>`;

  try {
    let res;
    if (activeProfileTab === 'posts') {
      res = await API.getUserPosts(targetUsername);
    } else if (activeProfileTab === 'comments') {
      res = await API.getUserComments(targetUsername);
    } else if (activeProfileTab === 'liked') {
      res = await API.getUserLikedPosts(targetUsername);
    } else if (activeProfileTab === 'saved') {
      res = await API.getUserSavedPosts();
    }

    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
          <i class="bi bi-archive" style="font-size: 2.2rem; margin-bottom: 0.5rem; display: block; color: var(--accent-primary);"></i>
          <p>No ${activeProfileTab} found.</p>
        </div>
      `;
      return;
    }

    if (activeProfileTab === 'comments') {
      container.innerHTML = res.data.map((c) => `
        <div class="glass-card" style="padding: 1.25rem; margin-bottom: 1rem;">
          <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.4rem;">
            Commented on: <a href="/index.html?post=${c.post?._id}" style="color:var(--accent-primary);font-weight:600;">${escapeHTML(c.post?.title || 'Post')}</a>
          </div>
          <div style="font-size: 0.95rem; color: var(--text-primary);">${escapeHTML(c.content)}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">${formatTimeAgo(c.createdAt)}</div>
        </div>
      `).join('');
    } else {
      container.innerHTML = res.data.map((post) => createPostCardHTML(post)).join('');
    }
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding: 2rem; text-align: center; color:#ef4444;">${err.message}</div>`;
  }
};

// Edit Profile Modal
const initEditProfileModal = () => {
  const modal = document.getElementById('edit-profile-modal');
  if (!modal) return;

  modal.querySelectorAll('.modal-close, .btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  const form = document.getElementById('edit-profile-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('edit-fullname-input').value.trim();
      const bio = document.getElementById('edit-bio-input').value.trim();
      const location = document.getElementById('edit-location-input').value.trim();
      const avatar = document.getElementById('edit-avatar-input').value.trim();
      const coverImage = document.getElementById('edit-cover-input').value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      try {
        if (submitBtn) submitBtn.disabled = true;
        const res = await API.updateProfile({ fullName, bio, location, avatar, coverImage });
        if (res.success && res.data) {
          showToast('Profile updated successfully!', 'success');
          modal.classList.remove('active');
          window.setSession(localStorage.getItem('connecthub_token'), res.data);
          loadProfile();
        }
      } catch (err) {
        showToast(err.message || 'Profile update failed', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
};

const openEditProfileModal = () => {
  const modal = document.getElementById('edit-profile-modal');
  if (!modal || !profileUserData) return;

  document.getElementById('edit-fullname-input').value = profileUserData.fullName || '';
  document.getElementById('edit-bio-input').value = profileUserData.bio || '';
  document.getElementById('edit-location-input').value = profileUserData.location || '';
  document.getElementById('edit-avatar-input').value = profileUserData.avatar || '';
  document.getElementById('edit-cover-input').value = profileUserData.coverImage || '';

  modal.classList.add('active');
};

// Followers / Following Modal
const openFollowModal = async (type = 'followers') => {
  const modal = document.getElementById('follow-list-modal');
  if (!modal || !profileUserData) return;

  const titleEl = document.getElementById('follow-modal-title');
  const listEl = document.getElementById('follow-modal-list');
  if (titleEl) titleEl.textContent = type === 'followers' ? 'Followers' : 'Following';

  modal.classList.add('active');
  listEl.innerHTML = `<div class="skeleton" style="height:60px;"></div>`;

  try {
    const res = type === 'followers'
      ? await API.getUserFollowers(profileUserData.username)
      : await API.getUserFollowing(profileUserData.username);

    if (!res.success || !res.data || res.data.length === 0) {
      listEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:1.5rem;">No ${type} yet.</div>`;
      return;
    }

    listEl.innerHTML = res.data.map((u) => createUserCardHTML(u)).join('');
  } catch (err) {
    listEl.innerHTML = `<div style="color:#ef4444;text-align:center;">${err.message}</div>`;
  }
};

window.openEditProfileModal = openEditProfileModal;
window.openFollowModal = openFollowModal;
