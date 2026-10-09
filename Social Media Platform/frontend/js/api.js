// =========================================================
// ConnectHub API Client & Notification Toast System
// =========================================================

const API_BASE = '/api';

// Toast Notification Manager
const showToast = (message, type = 'info', duration = 3500) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  };

  toast.innerHTML = `
    <i class="bi ${iconMap[type] || 'bi-info-circle-fill'}" style="font-size: 1.1rem; color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'}"></i>
    <div style="flex: 1; font-size: 0.88rem; font-weight: 500;">${message}</div>
    <button style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:0.2rem;" onclick="this.parentElement.remove()">
      <i class="bi bi-x"></i>
    </button>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

// Central API Request Wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('connecthub_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401 && token) {
        // Token invalid or expired
        console.warn('Authentication token expired or invalid.');
        localStorage.removeItem('connecthub_token');
        localStorage.removeItem('connecthub_user');
        window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
};

// File / Image Upload Request
const apiUpload = async (file) => {
  const token = localStorage.getItem('connecthub_token');
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'File upload failed');
  }
  return data;
};

// API Services
const API = {
  // Auth
  register: (userData) => apiRequest('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => apiRequest('/auth/me'),
  forgotPassword: (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: { email } }),

  // Users
  getUserProfile: (username) => apiRequest(`/users/${username}`),
  updateProfile: (profileData) => apiRequest('/users/profile', { method: 'PUT', body: profileData }),
  toggleFollow: (userId) => apiRequest(`/users/${userId}/follow`, { method: 'POST' }),
  getUserFollowers: (username) => apiRequest(`/users/${username}/followers`),
  getUserFollowing: (username) => apiRequest(`/users/${username}/following`),
  getSuggestedUsers: () => apiRequest('/users/suggested'),
  getUserPosts: (username) => apiRequest(`/users/${username}/posts`),
  getUserComments: (username) => apiRequest(`/users/${username}/comments`),
  getUserLikedPosts: (username) => apiRequest(`/users/${username}/liked`),
  getUserSavedPosts: () => apiRequest('/users/saved'),

  // Posts
  createPost: (postData) => apiRequest('/posts', { method: 'POST', body: postData }),
  getFeed: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/posts?${query}`);
  },
  getPostById: (id) => apiRequest(`/posts/${id}`),
  deletePost: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE' }),
  toggleLikePost: (id) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),
  votePost: (id, voteType) => apiRequest(`/posts/${id}/vote`, { method: 'POST', body: { voteType } }),
  toggleSavePost: (id) => apiRequest(`/posts/${id}/save`, { method: 'POST' }),

  // Comments
  createComment: (data) => apiRequest('/comments', { method: 'POST', body: data }),
  getPostComments: (postId) => apiRequest(`/comments/post/${postId}`),
  toggleLikeComment: (id) => apiRequest(`/comments/${id}/like`, { method: 'POST' }),
  deleteComment: (id) => apiRequest(`/comments/${id}`, { method: 'DELETE' }),

  // Communities
  createCommunity: (commData) => apiRequest('/communities', { method: 'POST', body: commData }),
  getAllCommunities: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/communities?${query}`);
  },
  getCommunityBySlug: (slug) => apiRequest(`/communities/${slug}`),
  getCommunityPosts: (slug, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/communities/${slug}/posts?${query}`);
  },
  getCommunityMembers: (slug) => apiRequest(`/communities/${slug}/members`),
  toggleJoinCommunity: (id) => apiRequest(`/communities/${id}/join`, { method: 'POST' }),

  // Notifications
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/notifications?${query}`);
  },
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),

  // Search & Trending
  search: (query, type = 'all') => apiRequest(`/search?q=${encodeURIComponent(query)}&type=${type}`),
  getTrending: () => apiRequest('/trending'),

  // Upload
  uploadImage: apiUpload,
};

window.API = API;
window.showToast = showToast;
