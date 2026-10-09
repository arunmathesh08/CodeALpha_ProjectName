// =========================================================
// ConnectHub Authentication & User State Controller
// =========================================================

let currentUser = null;

const getStoredUser = () => {
  const u = localStorage.getItem('connecthub_user');
  try {
    return u ? JSON.parse(u) : null;
  } catch (e) {
    return null;
  }
};

const setSession = (token, user) => {
  localStorage.setItem('connecthub_token', token);
  localStorage.setItem('connecthub_user', JSON.stringify(user));
  currentUser = user;
  updateAuthUI();
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: user }));
};

const clearSession = () => {
  localStorage.removeItem('connecthub_token');
  localStorage.removeItem('connecthub_user');
  currentUser = null;
  updateAuthUI();
  window.dispatchEvent(new CustomEvent('auth-changed', { detail: null }));
  showToast('You have been logged out.', 'info');
};

const checkAuth = async () => {
  const token = localStorage.getItem('connecthub_token');
  if (!token) {
    currentUser = null;
    updateAuthUI();
    return null;
  }

  try {
    const res = await API.getMe();
    if (res.success && res.data) {
      currentUser = res.data;
      localStorage.setItem('connecthub_user', JSON.stringify(currentUser));
      updateAuthUI();
      return currentUser;
    }
  } catch (err) {
    clearSession();
  }
  return null;
};

const updateAuthUI = () => {
  const guestElements = document.querySelectorAll('.auth-guest-only');
  const userElements = document.querySelectorAll('.auth-user-only');
  const userAvatars = document.querySelectorAll('.current-user-avatar');
  const userFullNames = document.querySelectorAll('.current-user-fullname');
  const userUsernames = document.querySelectorAll('.current-user-username');
  const userProfileLinks = document.querySelectorAll('.current-user-profile-link');

  if (currentUser) {
    guestElements.forEach((el) => (el.style.display = 'none'));
    userElements.forEach((el) => (el.style.display = ''));

    userAvatars.forEach((el) => {
      if (el.tagName === 'IMG') {
        el.src = currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.username)}`;
        el.alt = currentUser.fullName;
      }
    });

    userFullNames.forEach((el) => (el.textContent = currentUser.fullName));
    userUsernames.forEach((el) => (el.textContent = `@${currentUser.username}`));
    userProfileLinks.forEach((el) => {
      el.href = `/profile.html?u=${currentUser.username}`;
    });
  } else {
    guestElements.forEach((el) => (el.style.display = ''));
    userElements.forEach((el) => (el.style.display = 'none'));
  }
};

// Modal Open/Close Helpers
const openAuthModal = (mode = 'login') => {
  const modal = document.getElementById('auth-modal');
  if (!modal) {
    window.location.href = `/auth.html?mode=${mode}`;
    return;
  }

  switchAuthTab(mode);
  modal.classList.add('active');
};

const closeAuthModal = () => {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
};

const switchAuthTab = (tab) => {
  const loginForm = document.getElementById('login-form-container');
  const registerForm = document.getElementById('register-form-container');
  const forgotForm = document.getElementById('forgot-form-container');
  const tabLogin = document.getElementById('tab-auth-login');
  const tabRegister = document.getElementById('tab-auth-register');

  if (loginForm && registerForm) {
    loginForm.style.display = tab === 'login' ? 'block' : 'none';
    registerForm.style.display = tab === 'register' ? 'block' : 'none';
    if (forgotForm) forgotForm.style.display = tab === 'forgot' ? 'block' : 'none';

    if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
    if (tabRegister) tabRegister.classList.toggle('active', tab === 'register');
  }
};

// Quick Demo Login Helper
const quickDemoLogin = async (email) => {
  try {
    showToast(`Logging in as demo user (${email.split('@')[0]})...`, 'info', 1500);
    const res = await API.login({
      emailOrUsername: email,
      password: 'Password@123',
    });

    if (res.success && res.token) {
      setSession(res.token, res.data);
      closeAuthModal();
      showToast(`Welcome back, ${res.data.fullName}!`, 'success');
      // If on auth page, redirect to home
      if (window.location.pathname.includes('auth.html')) {
        window.location.href = '/index.html';
      }
    }
  } catch (err) {
    showToast(err.message || 'Demo login failed', 'error');
  }
};

// Initialize auth listeners
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = getStoredUser();
  updateAuthUI();
  await checkAuth();

  // User Dropdown toggle
  const userMenuBtn = document.getElementById('nav-user-menu-btn');
  const userDropdown = document.getElementById('nav-user-dropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
      }
    });
  }

  // Logout triggers
  document.querySelectorAll('.logout-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      if (userDropdown) userDropdown.classList.remove('show');
    });
  });

  // Auth modal handlers
  const authModal = document.getElementById('auth-modal');
  if (authModal) {
    authModal.querySelectorAll('.modal-close, .btn-close-modal').forEach((btn) => {
      btn.addEventListener('click', closeAuthModal);
    });

    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailOrUsername = loginForm.emailOrUsername.value.trim();
        const password = loginForm.password.value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        try {
          if (submitBtn) submitBtn.disabled = true;
          const res = await API.login({ emailOrUsername, password });
          if (res.success) {
            setSession(res.token, res.data);
            closeAuthModal();
            loginForm.reset();
            showToast(`Welcome back, ${res.data.fullName}!`, 'success');
            if (window.location.pathname.includes('auth.html')) {
              window.location.href = '/index.html';
            }
          }
        } catch (err) {
          showToast(err.message || 'Login failed', 'error');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // Register Form Submit
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = registerForm.username.value.trim();
        const fullName = registerForm.fullName.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const bio = registerForm.bio ? registerForm.bio.value.trim() : '';
        const submitBtn = registerForm.querySelector('button[type="submit"]');

        try {
          if (submitBtn) submitBtn.disabled = true;
          const res = await API.register({ username, fullName, email, password, bio });
          if (res.success) {
            setSession(res.token, res.data);
            closeAuthModal();
            registerForm.reset();
            showToast(`Welcome to ConnectHub, ${res.data.fullName}!`, 'success');
            if (window.location.pathname.includes('auth.html')) {
              window.location.href = '/index.html';
            }
          }
        } catch (err) {
          showToast(err.message || 'Registration failed', 'error');
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    // Forgot Password Submit
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = forgotForm.email.value.trim();
        try {
          const res = await API.forgotPassword(email);
          showToast(res.message, 'success', 5000);
          switchAuthTab('login');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  }
});

window.getCurrentUser = () => currentUser;
window.checkAuth = checkAuth;
window.setSession = setSession;
window.clearSession = clearSession;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.quickDemoLogin = quickDemoLogin;
