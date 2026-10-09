// =========================================================
// ConnectHub Global Search & Explore Controller
// =========================================================

let currentSearchQuery = '';
let activeSearchTab = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  currentSearchQuery = urlParams.get('q') || '';

  const searchInput = document.getElementById('search-page-input');
  if (searchInput && currentSearchQuery) {
    searchInput.value = currentSearchQuery;
  }

  // Bind Tabs (All, Users, Posts, Communities)
  initSearchTabs();

  // Bind Search Input Handler
  initSearchInput();

  if (currentSearchQuery) {
    await performSearch();
  } else {
    // Show Explore Communities Grid by default
    await loadExploreCommunities();
  }
});

const initSearchTabs = () => {
  const tabBtns = document.querySelectorAll('.search-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeSearchTab = btn.getAttribute('data-tab');
      if (currentSearchQuery) {
        performSearch();
      }
    });
  });
};

const initSearchInput = () => {
  const searchInput = document.getElementById('search-page-input');
  const searchBtn = document.getElementById('search-page-btn');

  const executeSearch = () => {
    currentSearchQuery = searchInput.value.trim();
    if (currentSearchQuery) {
      window.history.replaceState(null, '', `/search.html?q=${encodeURIComponent(currentSearchQuery)}`);
      performSearch();
    } else {
      loadExploreCommunities();
    }
  };

  if (searchBtn) searchBtn.addEventListener('click', executeSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeSearch();
    });
  }
};

const performSearch = async () => {
  const resultsContainer = document.getElementById('search-results-container');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `<div class="glass-card skeleton" style="height: 180px; margin-bottom: 1rem;"></div>`;

  try {
    const res = await API.search(currentSearchQuery, activeSearchTab);
    if (!res.success || !res.data) {
      resultsContainer.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;">No results found</div>`;
      return;
    }

    const { users = [], posts = [], communities = [] } = res.data;

    let html = '';

    // Communities section
    if ((activeSearchTab === 'all' || activeSearchTab === 'communities') && communities.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size:1.1rem;margin-bottom:0.75rem;color:var(--text-secondary);">Communities (${communities.length})</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:0.75rem;">
            ${communities.map((c) => `
              <div class="glass-card" style="padding:1rem;display:flex;align-items:center;justify-content:space-between;">
                <a href="/community.html?c=${c.slug}" style="display:flex;align-items:center;gap:0.75rem;">
                  <img src="${c.icon}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;" />
                  <div>
                    <div style="font-weight:700;font-size:0.95rem;">c/${escapeHTML(c.name)}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">${c.memberCount || 1} members</div>
                  </div>
                </a>
                <button class="btn btn-sm ${c.isMember ? 'btn-secondary' : 'btn-outline'} comm-join-toggle-btn" data-comm-id="${c._id}">
                  ${c.isMember ? 'Joined' : 'Join'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Users section
    if ((activeSearchTab === 'all' || activeSearchTab === 'users') && users.length > 0) {
      html += `
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size:1.1rem;margin-bottom:0.75rem;color:var(--text-secondary);">People (${users.length})</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:0.75rem;">
            ${users.map((u) => `
              <div class="glass-card" style="padding:1rem;display:flex;align-items:center;justify-content:space-between;">
                <a href="/profile.html?u=${u.username}" style="display:flex;align-items:center;gap:0.75rem;">
                  <img src="${u.avatar}" class="avatar-img" />
                  <div>
                    <div style="font-weight:700;font-size:0.95rem;">${escapeHTML(u.fullName)}</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);">@${escapeHTML(u.username)}</div>
                  </div>
                </a>
                ${
                  !u.isSelf
                    ? `<button class="btn btn-sm ${u.isFollowing ? 'btn-secondary' : 'btn-primary'} follow-toggle-btn" data-user-id="${u._id}">
                         ${u.isFollowing ? 'Following' : 'Follow'}
                       </button>`
                    : ''
                }
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Posts section
    if ((activeSearchTab === 'all' || activeSearchTab === 'posts') && posts.length > 0) {
      html += `
        <div>
          <h2 style="font-size:1.1rem;margin-bottom:0.75rem;color:var(--text-secondary);">Posts (${posts.length})</h2>
          <div style="display:flex;flex-direction:column;gap:1.25rem;">
            ${posts.map((post) => createPostCardHTML(post)).join('')}
          </div>
        </div>
      `;
    }

    if (!html) {
      resultsContainer.innerHTML = `
        <div class="glass-card" style="padding: 3.5rem 1.5rem; text-align: center; color: var(--text-muted);">
          <i class="bi bi-search" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--accent-primary);"></i>
          <h3 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.5rem;">No matches found for "${escapeHTML(currentSearchQuery)}"</h3>
          <p style="font-size: 0.9rem;">Try searching for tags, topics, usernames, or browse all communities.</p>
        </div>
      `;
      return;
    }

    resultsContainer.innerHTML = html;
  } catch (err) {
    resultsContainer.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;color:#ef4444;">${err.message}</div>`;
  }
};

const loadExploreCommunities = async () => {
  const container = document.getElementById('search-results-container');
  if (!container) return;

  container.innerHTML = `<div class="glass-card skeleton" style="height: 200px;"></div>`;

  try {
    const res = await API.getAllCommunities({ limit: 30 });
    if (res.success && res.data) {
      container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
          <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:0.4rem;">Explore Communities</h2>
          <p style="color:var(--text-secondary);font-size:0.92rem;margin-bottom:1.25rem;">Discover vibrant groups discussing technology, gaming, movies, programming, and student life.</p>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(290px, 1fr));gap:1rem;">
            ${res.data.map((c) => `
              <div class="glass-card" style="padding:1.25rem;display:flex;flex-direction:column;gap:0.75rem;justify-content:space-between;">
                <div style="display:flex;align-items:flex-start;gap:0.85rem;">
                  <img src="${c.icon}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;border:1px solid var(--border-color);" />
                  <div style="display:flex;flex-direction:column;gap:0.2rem;">
                    <a href="/community.html?c=${c.slug}" style="font-weight:700;font-size:1.05rem;">c/${escapeHTML(c.name)}</a>
                    <span class="badge badge-primary" style="align-self:flex-start;">${escapeHTML(c.category || 'General')}</span>
                  </div>
                </div>

                <p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.4;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
                  ${escapeHTML(c.description || 'Welcome to this community!')}
                </p>

                <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border-color);padding-top:0.6rem;">
                  <span style="font-size:0.8rem;color:var(--text-muted);">${c.memberCount || 1} members</span>
                  <button class="btn btn-sm ${c.isMember ? 'btn-secondary' : 'btn-outline'} comm-join-toggle-btn" data-comm-id="${c._id}">
                    ${c.isMember ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;color:#ef4444;">${err.message}</div>`;
  }
};
