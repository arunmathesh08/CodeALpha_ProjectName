// =========================================================
// ConnectHub Community Page Controller
// =========================================================

let currentCommunitySlug = '';
let currentCommunityData = null;
let activeCommunityTab = 'posts';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentCommunitySlug = urlParams.get('c') || 'technology';

  // Bind Tabs
  initCommunityTabs();

  // Bind Create Community Modal
  initCreateCommunityModal();

  // Load Community Header & Details
  await loadCommunityHeader();

  // Load Community Tab Content
  await loadCommunityTabContent();
});

const initCommunityTabs = () => {
  const tabBtns = document.querySelectorAll('.community-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCommunityTab = btn.getAttribute('data-tab');
      loadCommunityTabContent();
    });
  });
};

const loadCommunityHeader = async () => {
  const container = document.getElementById('community-header-container');
  const rulesContainer = document.getElementById('community-rules-container');
  if (!container) return;

  try {
    const res = await API.getCommunityBySlug(currentCommunitySlug);
    if (!res.success || !res.data) {
      container.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;">Community not found</div>`;
      return;
    }

    currentCommunityData = res.data;
    const comm = currentCommunityData;
    const isMember = !!comm.isMember;

    container.innerHTML = `
      <div class="glass-card community-banner-card">
        <img src="${comm.banner || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'}" alt="Banner" class="community-banner-img" />

        <div class="community-header-body">
          <div class="community-header-row">
            <img src="${comm.icon || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(comm.name)}" alt="${escapeHTML(comm.name)}" class="community-header-icon" />
            <div style="display:flex; gap:0.6rem;">
              <button class="btn btn-sm ${isMember ? 'btn-secondary' : 'btn-primary'}" id="comm-page-join-btn" data-comm-id="${comm._id}">
                <i class="bi bi-${isMember ? 'check' : 'plus'}-lg"></i> ${isMember ? 'Joined' : 'Join Community'}
              </button>
            </div>
          </div>

          <div class="community-title-wrap">
            <h1 class="community-name">c/${escapeHTML(comm.name)}</h1>
            <div class="community-stats">
              <span class="badge badge-primary">${escapeHTML(comm.category || 'General')}</span> • 
              <strong id="comm-members-count">${comm.memberCount || 1}</strong> members • 
              <strong>${comm.postsCount || 0}</strong> posts
            </div>
          </div>

          ${comm.description ? `<p style="margin-top:0.75rem;font-size:0.92rem;color:var(--text-secondary);max-width:700px;">${escapeHTML(comm.description)}</p>` : ''}
        </div>
      </div>
    `;

    // Render Rules in sidebar
    if (rulesContainer) {
      if (comm.rules && comm.rules.length > 0) {
        rulesContainer.innerHTML = `
          <div class="rules-list">
            ${comm.rules.map((r, i) => `
              <div class="rule-item">
                <span class="rule-title">${i + 1}. ${escapeHTML(r.title)}</span>
                ${r.description ? `<span class="rule-desc">${escapeHTML(r.description)}</span>` : ''}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        rulesContainer.innerHTML = `<div style="font-size:0.85rem;color:var(--text-muted);">No specific rules posted.</div>`;
      }
    }

    // Bind Join button
    const joinBtn = document.getElementById('comm-page-join-btn');
    if (joinBtn) {
      joinBtn.addEventListener('click', async () => {
        const user = window.getCurrentUser && window.getCurrentUser();
        if (!user) {
          window.openAuthModal('login');
          return;
        }

        try {
          const res = await API.toggleJoinCommunity(comm._id);
          if (res.success && res.data) {
            const { isMember: nowMember, memberCount } = res.data;
            joinBtn.innerHTML = `<i class="bi bi-${nowMember ? 'check' : 'plus'}-lg"></i> ${nowMember ? 'Joined' : 'Join Community'}`;
            joinBtn.className = `btn btn-sm ${nowMember ? 'btn-secondary' : 'btn-primary'}`;
            const countEl = document.getElementById('comm-members-count');
            if (countEl) countEl.textContent = memberCount;
            showToast(nowMember ? `Joined c/${comm.name}` : `Left c/${comm.name}`, 'info');
          }
        } catch (err) {
          showToast(err.message || 'Join failed', 'error');
        }
      });
    }
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;color:#ef4444;">${err.message}</div>`;
  }
};

const loadCommunityTabContent = async () => {
  const container = document.getElementById('community-tab-content');
  if (!container) return;

  if (activeCommunityTab === 'about') {
    if (!currentCommunityData) return;
    const comm = currentCommunityData;
    const createdDate = new Date(comm.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const creator = comm.creator || {};

    container.innerHTML = `
      <div class="glass-card" style="padding:1.5rem; display:flex; flex-direction:column; gap:1rem;">
        <h3 style="font-size:1.15rem;">About c/${escapeHTML(comm.name)}</h3>
        <p style="color:var(--text-secondary);font-size:0.95rem;">${escapeHTML(comm.description || 'Welcome to this community!')}</p>
        <div style="border-top:1px solid var(--border-color);padding-top:0.75rem;font-size:0.88rem;color:var(--text-muted);display:flex;flex-direction:column;gap:0.4rem;">
          <div><i class="bi bi-calendar-event"></i> Created on ${createdDate}</div>
          <div><i class="bi bi-person-badge"></i> Created by <a href="/profile.html?u=${creator.username}" style="color:var(--accent-primary);font-weight:600;">@${escapeHTML(creator.username || 'admin')}</a></div>
          <div><i class="bi bi-shield-check"></i> Moderation: Active Community Guidelines</div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="glass-card skeleton" style="height: 180px; margin-bottom: 1rem;"></div>`;

  try {
    const res = await API.getCommunityPosts(currentCommunitySlug, { tab: activeCommunityTab });
    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
          <i class="bi bi-chat-square-dots" style="font-size: 2.2rem; margin-bottom: 0.5rem; display: block; color: var(--accent-primary);"></i>
          <p>No posts in this community yet.</p>
          <button class="btn btn-primary btn-sm" style="margin-top:0.75rem;" onclick="openCreatePostModal()">Create First Post</button>
        </div>
      `;
      return;
    }

    container.innerHTML = res.data.map((post) => createPostCardHTML(post)).join('');
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;color:#ef4444;">${err.message}</div>`;
  }
};

// Create Community Modal
const initCreateCommunityModal = () => {
  const modal = document.getElementById('create-community-modal');
  if (!modal) return;

  modal.querySelectorAll('.modal-close, .btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', () => modal.classList.remove('active'));
  });

  const form = document.getElementById('create-community-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('comm-name-input').value.trim();
      const description = document.getElementById('comm-desc-input').value.trim();
      const category = document.getElementById('comm-category-select').value;
      const icon = document.getElementById('comm-icon-input').value.trim();
      const banner = document.getElementById('comm-banner-input').value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!name) {
        showToast('Please enter a community name', 'error');
        return;
      }

      try {
        if (submitBtn) submitBtn.disabled = true;
        const res = await API.createCommunity({ name, description, category, icon, banner });
        if (res.success && res.data) {
          showToast(`Community c/${res.data.name} created!`, 'success');
          modal.classList.remove('active');
          window.location.href = `/community.html?c=${res.data.slug}`;
        }
      } catch (err) {
        showToast(err.message || 'Failed to create community', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
};

const openCreateCommunityModal = () => {
  const user = window.getCurrentUser && window.getCurrentUser();
  if (!user) {
    window.openAuthModal('login');
    return;
  }
  const modal = document.getElementById('create-community-modal');
  if (modal) modal.classList.add('active');
};

window.openCreateCommunityModal = openCreateCommunityModal;
