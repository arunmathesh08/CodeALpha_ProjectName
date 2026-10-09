// =========================================================
// ConnectHub Notifications Controller
// =========================================================

let activeNotificationFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
  // Bind category tabs
  initNotificationTabs();

  // Bind Mark All Read
  const markAllBtn = document.getElementById('mark-all-read-btn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      try {
        const res = await API.markAllNotificationsRead();
        if (res.success) {
          showToast('All notifications marked as read', 'success');
          loadNotifications();
          // Clear badge
          document.querySelectorAll('.notification-unread-badge').forEach((b) => (b.style.display = 'none'));
        }
      } catch (err) {
        showToast(err.message || 'Action failed', 'error');
      }
    });
  }

  // Load Notifications List
  await loadNotifications();
});

const initNotificationTabs = () => {
  const tabBtns = document.querySelectorAll('.notification-tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeNotificationFilter = btn.getAttribute('data-filter');
      loadNotifications();
    });
  });
};

const loadNotifications = async () => {
  const container = document.getElementById('notifications-list-container');
  if (!container) return;

  const user = window.getCurrentUser && window.getCurrentUser();
  if (!user) {
    container.innerHTML = `
      <div class="glass-card" style="padding:3rem 1.5rem;text-align:center;">
        <i class="bi bi-bell-slash" style="font-size:2.5rem;color:var(--text-muted);display:block;margin-bottom:0.75rem;"></i>
        <h3>Please log in</h3>
        <p style="color:var(--text-secondary);margin-top:0.3rem;">Sign in to view your interactions, likes, comments, and new followers.</p>
        <button class="btn btn-primary btn-sm" style="margin-top:1rem;" onclick="openAuthModal('login')">Log In</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `<div class="glass-card skeleton" style="height: 100px; margin-bottom: 0.75rem;"></div><div class="glass-card skeleton" style="height: 100px;"></div>`;

  try {
    const res = await API.getNotifications({ filter: activeNotificationFilter });
    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="padding: 3rem 1.5rem; text-align: center; color: var(--text-muted);">
          <i class="bi bi-bell" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--accent-primary);"></i>
          <h3 style="font-size: 1.15rem; color: var(--text-primary); margin-bottom: 0.3rem;">No notifications</h3>
          <p style="font-size: 0.9rem;">You're all caught up!</p>
        </div>
      `;
      return;
    }

    const typeIcons = {
      like_post: { icon: 'bi-heart-fill', color: '#ec4899' },
      vote_post: { icon: 'bi-arrow-up-circle-fill', color: '#ff5722' },
      comment_post: { icon: 'bi-chat-text-fill', color: '#3b82f6' },
      reply_comment: { icon: 'bi-reply-fill', color: '#6366f1' },
      follow_user: { icon: 'bi-person-plus-fill', color: '#10b981' },
      like_comment: { icon: 'bi-heart-fill', color: '#ec4899' },
    };

    container.innerHTML = res.data.map((n) => {
      const sender = n.sender || {};
      const config = typeIcons[n.type] || { icon: 'bi-bell-fill', color: '#6366f1' };
      const timeAgo = formatTimeAgo(n.createdAt);
      const isUnread = !n.isRead;

      let link = '/index.html';
      if (n.post) link = `/index.html?post=${n.post._id || n.post}`;
      else if (n.type === 'follow_user') link = `/profile.html?u=${sender.username}`;

      return `
        <div class="glass-card" style="padding: 1.1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.75rem; ${isUnread ? 'border-left: 4px solid var(--accent-primary); background: var(--bg-card-hover);' : ''}">
          <div style="display: flex; align-items: center; gap: 0.9rem; overflow: hidden;">
            <div style="position: relative;">
              <img src="${sender.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(sender.username || 'user')}" class="avatar-img" />
              <div style="position: absolute; bottom: -2px; right: -2px; width: 18px; height: 18px; border-radius: 50%; background: ${config.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.65rem;">
                <i class="bi ${config.icon}"></i>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.15rem; overflow: hidden;">
              <a href="${link}" style="font-size: 0.92rem; color: var(--text-primary); font-weight: ${isUnread ? '600' : '400'}; line-height: 1.35;">
                ${escapeHTML(n.message)}
              </a>
              <span style="font-size: 0.78rem; color: var(--text-muted);">${timeAgo}</span>
            </div>
          </div>

          ${
            isUnread
              ? `<button class="btn btn-secondary btn-sm mark-single-read-btn" data-id="${n._id}" title="Mark as read" style="flex-shrink:0;">
                   <i class="bi bi-check2"></i>
                 </button>`
              : ''
          }
        </div>
      `;
    }).join('');

    // Bind mark single read buttons
    container.querySelectorAll('.mark-single-read-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const notifId = btn.getAttribute('data-id');
        try {
          const r = await API.markNotificationRead(notifId);
          if (r.success) {
            loadNotifications();
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding:2rem;text-align:center;color:#ef4444;">${err.message}</div>`;
  }
};
