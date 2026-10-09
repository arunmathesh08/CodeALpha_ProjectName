// =========================================================
// ConnectHub Theme Controller (Dark / Light Mode)
// =========================================================

const initTheme = () => {
  const savedTheme = localStorage.getItem('connecthub_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcons(savedTheme);
};

const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('connecthub_theme', newTheme);
  updateThemeIcons(newTheme);
};

const updateThemeIcons = (theme) => {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach((btn) => {
    const icon = btn.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.className = 'bi bi-sun-fill';
        btn.setAttribute('title', 'Switch to Light Mode');
      } else {
        icon.className = 'bi bi-moon-stars-fill';
        btn.setAttribute('title', 'Switch to Dark Mode');
      }
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
});

window.toggleTheme = toggleTheme;
