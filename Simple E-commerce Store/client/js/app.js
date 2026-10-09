/* ============================================================
   ShopEase — app.js
   Shared utilities: Navigation, Cart (localStorage), Notifications
   ============================================================ */

// API Base URL — same origin since Express serves both
const API_BASE = '/api';

// ============================================================
// CART MANAGEMENT (localStorage)
// ============================================================

/**
 * Get cart items from localStorage
 * @returns {Array} Cart items array
 */
function getCart() {
  try {
    const cart = localStorage.getItem('shopease_cart');
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    console.error('Error reading cart:', e);
    return [];
  }
}

/**
 * Save cart items to localStorage
 * @param {Array} cart - Cart items array
 */
function saveCart(cart) {
  try {
    localStorage.setItem('shopease_cart', JSON.stringify(cart));
    updateCartCount();
  } catch (e) {
    console.error('Error saving cart:', e);
  }
}

/**
 * Add a product to the cart
 * @param {Object} product - Product object with _id, name, price, image, stock
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {boolean} Whether the item was successfully added
 */
function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.productId === product._id);

  if (existingIndex > -1) {
    // Product already in cart — increase quantity
    const newQty = cart[existingIndex].quantity + quantity;
    if (newQty > product.stock) {
      showNotification(`Cannot add more. Only ${product.stock} in stock.`, 'warning');
      return false;
    }
    cart[existingIndex].quantity = newQty;
  } else {
    // New product
    if (quantity > product.stock) {
      showNotification(`Cannot add ${quantity}. Only ${product.stock} in stock.`, 'warning');
      return false;
    }
    cart.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      stock: product.stock
    });
  }

  saveCart(cart);
  showNotification(`${product.name} added to cart!`, 'success');
  return true;
}

/**
 * Update quantity of a cart item
 * @param {string} productId - Product ID
 * @param {number} newQuantity - New quantity
 */
function updateCartQuantity(productId, newQuantity) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);

  if (item) {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    if (newQuantity > item.stock) {
      showNotification(`Only ${item.stock} available in stock.`, 'warning');
      return;
    }
    item.quantity = newQuantity;
    saveCart(cart);
  }
}

/**
 * Remove a product from cart
 * @param {string} productId - Product ID
 */
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(i => i.productId !== productId);
  saveCart(cart);
}

/**
 * Clear the entire cart
 */
function clearCart() {
  localStorage.removeItem('shopease_cart');
  updateCartCount();
}

/**
 * Get the total number of items in cart
 * @returns {number}
 */
function getCartItemCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calculate cart totals
 * @returns {Object} { subtotal, deliveryCharge, total }
 */
function calculateCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryCharge = subtotal >= 999 ? 0 : 50;
  const total = subtotal + deliveryCharge;
  return { subtotal, deliveryCharge, total };
}

// ============================================================
// CART COUNT BADGE
// ============================================================

/**
 * Update the cart count badge in the navbar
 */
function updateCartCount() {
  const countElements = document.querySelectorAll('.cart-count');
  const count = getCartItemCount();
  countElements.forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ============================================================
// CENTRALIZED CURRENCY CONVERSION & FORMATTING ENGINE
// ============================================================

// ============================================================
// CENTRALIZED CURRENCY CONVERSION & FORMATTING ENGINE
// ============================================================

const CURRENCIES = {
  'USD': {
    code: 'USD',
    symbol: '$',
    label: 'USD $',
    rateFromUSD: 1.0,
    rateFromINR: 1 / 83.0,
    locale: 'en-US',
    format: (val) => '$' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },
  'EUR': {
    code: 'EUR',
    symbol: '€',
    label: 'EUR €',
    rateFromUSD: 0.92,
    rateFromINR: 0.92 / 83.0,
    locale: 'de-DE',
    format: (val) => '€' + Number(val).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  },
  'INR': {
    code: 'INR',
    symbol: '₹',
    label: 'INR ₹',
    rateFromUSD: 83.0,
    rateFromINR: 1.0,
    locale: 'en-IN',
    format: (val) => '₹' + Math.round(val).toLocaleString('en-IN')
  },
  'GBP': {
    code: 'GBP',
    symbol: '£',
    label: 'GBP £',
    rateFromUSD: 0.79,
    rateFromINR: 0.79 / 83.0,
    locale: 'en-GB',
    format: (val) => '£' + Number(val).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
};

/**
 * Get current stored currency code (default: USD)
 */
function getStoredCurrency() {
  return localStorage.getItem('shopease_currency') || 'USD';
}

/**
 * Convert numerical amount between currencies based on configured exchange rates
 * @param {number|string} amount
 * @param {string|null} fromCurrency
 * @returns {number}
 */
function convertPrice(amount, fromCurrency = null) {
  if (amount === undefined || amount === null) return 0;
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
  const targetCurrency = getStoredCurrency();

  // If source currency is not specified:
  // <= 150 is USD base (e.g. $10.00, $34.00, $4.00)
  // > 150 is INR base (e.g. 599, 1299, 2499)
  const sourceCurrency = fromCurrency || (numeric <= 150 ? 'USD' : 'INR');

  if (sourceCurrency === targetCurrency) {
    return numeric;
  }

  // Normalize source to USD
  const inUSD = sourceCurrency === 'USD' ? numeric : (numeric / 83.0);

  // Convert USD to target
  const targetConfig = CURRENCIES[targetCurrency] || CURRENCIES['USD'];
  return inUSD * targetConfig.rateFromUSD;
}

/**
 * Format any numerical price according to the active global currency
 * @param {number|string} amount
 * @param {string|null} fromCurrency
 * @returns {string} Formatted localized price string (e.g. $10.00, €9.20, ₹830)
 */
function formatPrice(amount, fromCurrency = null) {
  const targetCurrency = getStoredCurrency();
  const converted = convertPrice(amount, fromCurrency);
  const config = CURRENCIES[targetCurrency] || CURRENCIES['USD'];
  return config.format(converted);
}

// ============================================================
// CENTRALIZED PRICING & DISCOUNT CALCULATION ENGINE
// ============================================================

/**
 * Calculate standard discount percentage and original/selling prices
 * Guarantees that:
 * 1. Selling price is ALWAYS strictly lower than the original price whenever a discount exists.
 * 2. Selling price and original price are never negative.
 * 3. Discount percentage is mathematically accurate: ((Original - Selling) / Original) * 100.
 *
 * @param {Object|number} productOrPrice
 * @param {number|null} explicitOriginalPrice
 * @param {number|null} explicitDiscountPercent
 * @returns {Object} { sellingPrice, originalPrice, discountPercent, hasDiscount, baseCurrency }
 */
function getProductPricing(productOrPrice, explicitOriginalPrice = null, explicitDiscountPercent = null) {
  let selling = 0;
  let original = 0;
  let discount = 0;
  let baseCurrency = 'USD';

  if (typeof productOrPrice === 'object' && productOrPrice !== null) {
    selling = parseFloat(productOrPrice.price || productOrPrice.sellingPrice) || 0;
    original = parseFloat(productOrPrice.originalPrice || productOrPrice.mrp || productOrPrice.oldPrice || explicitOriginalPrice) || 0;
    discount = parseFloat(productOrPrice.discount || productOrPrice.discountPercent || explicitDiscountPercent) || 0;
    baseCurrency = productOrPrice.baseCurrency || (selling <= 150 ? 'USD' : 'INR');
  } else {
    selling = parseFloat(productOrPrice) || 0;
    original = parseFloat(explicitOriginalPrice) || 0;
    discount = parseFloat(explicitDiscountPercent) || 0;
    baseCurrency = selling <= 150 ? 'USD' : 'INR';
  }

  // Ensure positive prices
  selling = Math.max(0, selling);
  original = Math.max(0, original);

  // If original price is not provided or zero, derive it from discount or assign realistic default (e.g. 20% to 25%)
  if (original <= 0) {
    if (discount > 0 && discount < 100) {
      original = Math.round((selling / (1 - discount / 100)) * 100) / 100;
    } else {
      // Standard realistic retail discount of 20%
      discount = 20;
      original = Math.round((selling / 0.8) * 100) / 100;
    }
  } else if (original < selling) {
    // If values were previously inverted (original < selling), swap them so original > selling
    const temp = original;
    original = selling;
    selling = temp;
    discount = Math.round(((original - selling) / original) * 100);
  } else if (original === selling) {
    // Exactly equal -> add realistic 20% discount margin to original MRP
    original = Math.round((selling / 0.8) * 100) / 100;
    discount = 20;
  } else {
    // Calculate mathematically exact discount percentage
    discount = Math.round(((original - selling) / original) * 100);
  }

  // Strict invariant: selling MUST be strictly less than original
  if (selling >= original && original > 0) {
    selling = Math.round(original * 0.8 * 100) / 100;
    discount = 20;
  }

  return {
    sellingPrice: selling,
    originalPrice: original,
    discountPercent: Math.max(1, Math.min(95, discount)),
    hasDiscount: original > selling && original > 0,
    baseCurrency: baseCurrency
  };
}

/**
 * Apply selected currency immediately across all components on current page
 */
function applyAppCurrency() {
  const currentCurrency = getStoredCurrency();
  const config = CURRENCIES[currentCurrency] || CURRENCIES['USD'];

  // Update badges on profile page & drawer
  const pageBadge = document.getElementById('page-currency-badge');
  if (pageBadge) pageBadge.textContent = config.label;
  const drawerBadge = document.getElementById('drawer-currency-badge');
  if (drawerBadge) drawerBadge.textContent = config.label;

  // 1. Static showcase & bestsellers price pairs on index.html
  // Pair up current selling price and crossed-out original price to guarantee selling < original
  document.querySelectorAll('.anon-card-prices, .bestseller-price-row').forEach(container => {
    const saleEl = container.querySelector('.price-pink, .current-price');
    const origEl = container.querySelector('.price-gray, .old-price, del');

    if (saleEl && origEl) {
      if (!saleEl.dataset.basePrice) {
        saleEl.dataset.basePrice = parseFloat(saleEl.textContent.replace(/[^0-9.-]+/g, '')) || 0;
      }
      if (!origEl.dataset.basePrice) {
        origEl.dataset.basePrice = parseFloat(origEl.textContent.replace(/[^0-9.-]+/g, '')) || 0;
      }

      let saleBase = parseFloat(saleEl.dataset.basePrice) || 0;
      let origBase = parseFloat(origEl.dataset.basePrice) || 0;

      const pricing = getProductPricing(saleBase, origBase);

      saleEl.dataset.basePrice = pricing.sellingPrice;
      origEl.dataset.basePrice = pricing.originalPrice;

      const fromCurr = pricing.baseCurrency;
      saleEl.textContent = formatPrice(pricing.sellingPrice, fromCurr);
      origEl.textContent = formatPrice(pricing.originalPrice, fromCurr);
    } else {
      container.querySelectorAll('.price-pink, .price-gray, .current-price, .old-price, [data-base-price]').forEach(el => {
        if (!el.dataset.basePrice) {
          const parsed = parseFloat(el.textContent.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(parsed)) {
            el.dataset.basePrice = parsed;
            el.dataset.baseCurrency = parsed <= 150 ? 'USD' : 'INR';
          }
        }
        if (el.dataset.basePrice) {
          const baseNum = parseFloat(el.dataset.basePrice);
          const fromCurr = el.dataset.baseCurrency || (baseNum <= 150 ? 'USD' : 'INR');
          el.textContent = formatPrice(baseNum, fromCurr);
        }
      });
    }
  });

  // Standalone price elements that may not be in a pair
  document.querySelectorAll('[data-base-price]').forEach(el => {
    if (el.closest('.anon-card-prices') || el.closest('.bestseller-price-row')) return;
    const baseNum = parseFloat(el.dataset.basePrice);
    if (!isNaN(baseNum)) {
      const fromCurr = el.dataset.baseCurrency || (baseNum <= 150 ? 'USD' : 'INR');
      el.textContent = formatPrice(baseNum, fromCurr);
    }
  });

  // 2. Re-render dynamic products on products page
  if (typeof renderProducts === 'function' && typeof filteredProducts !== 'undefined' && Array.isArray(filteredProducts)) {
    renderProducts(filteredProducts);
  }

  // 3. Featured products on index.html
  const featuredGrid = document.getElementById('featured-products-grid');
  if (featuredGrid && typeof fetchProducts === 'function') {
    fetchProducts().then(prods => {
      if (prods && prods.length) {
        featuredGrid.innerHTML = prods.slice(0, 8).map(product => {
          const stock = getStockStatus(product.stock);
          const pricing = getProductPricing(product);
          return `
            <div class="product-card" id="featured-${product._id}">
              <div class="product-card-image product-image-container">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <span class="product-card-badge">${product.category}</span>
              </div>
              <div class="product-card-body">
                <span class="product-card-category">${product.category}</span>
                <h3 class="product-card-name">${product.name}</h3>
                <p class="product-card-desc">${product.description}</p>
                <div class="product-card-meta">
                  <div class="product-card-pricing">
                    <span class="product-card-price">${formatPrice(pricing.sellingPrice)}</span>
                    ${pricing.hasDiscount ? `<del class="product-card-original">${formatPrice(pricing.originalPrice)}</del><span class="product-card-discount">(${pricing.discountPercent}% OFF)</span>` : ''}
                  </div>
                  <span class="product-card-rating">${generateStars(product.rating)} ${product.rating}</span>
                </div>
                <p class="product-card-stock ${stock.className}">${stock.text}</p>
                <div class="product-card-actions">
                  <a href="product-details.html?id=${product._id}" class="btn btn-secondary btn-sm btn-view-details">${t('view_details')}</a>
                  <button class="btn btn-primary btn-sm btn-add-cart" onclick="handleAddToCart('${product._id}')" ${product.stock === 0 ? 'disabled' : ''}>
                    <span class="cart-btn-icon">🛒</span> ${product.stock === 0 ? t('out_of_stock') : t('add_to_cart')}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    });
  }

  // 4. Cart page
  if (typeof renderCart === 'function') {
    renderCart();
  }

  // 5. Checkout page
  if (typeof renderCheckoutSummary === 'function') {
    renderCheckoutSummary();
  }

  // 6. Product details page
  if (typeof renderProductDetails === 'function' && typeof currentProduct !== 'undefined' && currentProduct) {
    renderProductDetails(currentProduct);
  }

  // 7. Profile drawer content
  if (typeof updateProfileDrawerContent === 'function') {
    updateProfileDrawerContent();
  }
}

/**
 * Open Currency Selector Modal (Reference Image 2)
 */
function openCurrencyModal() {
  closeProfileDrawer();
  ensureProfilePanelElements();
  const currentCurr = getStoredCurrency();
  const currentLang = getStoredLang();

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', label: 'USD $' },
    { code: 'EUR', name: 'Euro', symbol: '€', label: 'EUR €' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', label: 'INR ₹' },
    { code: 'GBP', name: 'British Pound', symbol: '£', label: 'GBP £' }
  ];

  const modalHtml = `
    <div class="profile-modal-backdrop active" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card" style="max-width: 400px;">
        <div class="profile-modal-header">
          <h3 class="profile-modal-title"><span>💱</span> ${t('currency', currentLang) || 'Select Currency'}</h3>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()" aria-label="Close">✕</button>
        </div>
        <div class="profile-modal-body" style="padding: 20px;">
          <div class="profile-currency-grid">
            ${currencies.map(curr => `
              <button type="button" class="profile-currency-btn ${currentCurr === curr.code ? 'active' : ''}" onclick="selectCurrency('${curr.code}')">
                <span style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-weight: 700; font-size: 1.1rem; min-width: 24px; text-align: center;">${curr.symbol}</span>
                  <span>${curr.code} — ${curr.name}</span>
                </span>
                <span style="font-weight: 600;">${curr.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

/**
 * Select a currency, update state, and re-render all prices
 */
function selectCurrency(currCode) {
  localStorage.setItem('shopease_currency', currCode);
  recordActivity('💱', `Currency set to ${currCode}`);
  closeAllProfileModals();
  applyAppCurrency();
  updateProfileDrawerContent();
  if (typeof syncPageProfile === 'function') {
    syncPageProfile();
  }
  showNotification(`Currency updated to ${currCode} 💱`, 'success');
}

// ============================================================
// STAR RATING
// ============================================================

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {string} HTML string with stars
 */
function generateStars(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars += '★';
  }
  if (hasHalf) {
    stars += '★';
  }
  const empty = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < empty; i++) {
    stars += '☆';
  }
  return stars;
}

// ============================================================
// STOCK STATUS
// ============================================================

/**
 * Get stock status info
 * @param {number} stock
 * @returns {Object} { text, className }
 */
function getStockStatus(stock) {
  if (stock === 0) {
    return { text: 'Out of Stock', className: 'stock-out' };
  } else if (stock <= 5) {
    return { text: `Only ${stock} left!`, className: 'stock-low' };
  } else {
    return { text: `In Stock (${stock})`, className: 'stock-in' };
  }
}

// ============================================================
// NOTIFICATIONS / TOAST
// ============================================================

/**
 * Show a notification toast
 * @param {string} message - Notification message
 * @param {string} type - 'success' | 'error' | 'warning'
 */
function showNotification(message, type = 'success') {
  // Create container if it doesn't exist
  let container = document.querySelector('.notification-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  notification.innerHTML = `
    <span class="notification-icon">${icons[type] || '📢'}</span>
    <span>${message}</span>
  `;

  container.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================================
// NAVIGATION
// ============================================================
// THEME MANAGEMENT (Light / Dark Mode)
// ============================================================

/**
 * Get current active theme ('light' or 'dark')
 * @returns {string}
 */
function getTheme() {
  const saved = localStorage.getItem('shopease_theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply theme to document and update all toggle buttons
 * @param {string} theme - 'light' | 'dark'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('shopease_theme', theme);

  // Update all theme toggle buttons & icons
  const toggles = document.querySelectorAll('.theme-toggle');
  toggles.forEach(toggle => {
    const isDark = theme === 'dark';
    const icon = toggle.querySelector('.theme-toggle-icon') || toggle;
    icon.textContent = isDark ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  });
}

/**
 * Toggle between light and dark mode
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || getTheme();
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

/**
 * Initialize theme listeners
 */
function initTheme() {
  const currentTheme = getTheme();
  applyTheme(currentTheme);

  // Attach click events to theme toggles
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  });
}

// ============================================================
// LOCALIZATION & I18N SYSTEM (Multi-Language Support)
// ============================================================

const TRANSLATIONS = {
  'English': {
    nav_home: '🏠 Home',
    nav_products: '📦 Products',
    nav_cart: '🛒 Cart',
    nav_signin: 'Sign In',
    my_profile: 'My Profile',
    edit_profile: 'Edit Profile',
    orders_purchases: 'Orders / Purchases',
    language: 'Language',
    currency: 'Currency',
    delivery_address: 'Delivery Address',
    log_out: 'Log Out',
    app_version: 'App Version 2.3',
    view_details: 'View Details',
    add_to_cart: 'Add to Cart',
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    search_placeholder: 'Search products by name or category...',
    all_categories: 'All Categories',
    sort_by: 'Sort by: Featured',
    trending_categories: 'Trending Categories',
    featured_products: 'Featured Products',
    why_choose_us: 'Why Choose ShopEase?',
    hero_title: 'Elevate Your Lifestyle with ShopEase',
    hero_subtitle: 'Discover curated collections of premium electronics, fashion, and lifestyle essentials with fast doorstep delivery.',
    hero_shop_now: 'Shop Now 🛍️',
    hero_explore: 'Explore Deals ⚡',
    save_changes: 'Save Changes',
    full_name: 'Full Name',
    email_address: 'Email Address',
    phone_number: 'Phone Number',
    choose_avatar_preset: 'Choose an avatar preset below or enter an image URL:',
    logout_confirm_title: 'Are you sure you want to log out?',
    logout_confirm_desc: 'You will need to sign in again to access your saved profile, delivery addresses, and orders.',
    cancel: 'Cancel',
    confirm_logout: 'Log Out',
    lang_updated: 'Language updated to English 🌐',
    logged_out_msg: 'Logged out successfully 👋'
  },
  'தமிழ் (Tamil)': {
    nav_home: '🏠 முகப்பு',
    nav_products: '📦 பொருட்கள்',
    nav_cart: '🛒 கூடை',
    nav_signin: 'உள்நுழைக',
    my_profile: 'என் சுயவிவரம்',
    edit_profile: 'சுயவிவரத்தைத் திருத்து',
    orders_purchases: 'ஆர்டர்கள் / வாங்குதல்கள்',
    language: 'மொழி',
    currency: 'நாணயம்',
    delivery_address: 'டெலிவரி முகவரி',
    log_out: 'வெளியேறு',
    app_version: 'பயன்பாட்டு பதிப்பு 2.3',
    view_details: 'விவரங்களைக் காண்க',
    add_to_cart: 'கூடையில் சேர்',
    in_stock: 'இருப்பில் உள்ளது',
    out_of_stock: 'கையிருப்பு இல்லை',
    search_placeholder: 'பொருட்கள் அல்லது வகைகளைத் தேடுங்கள்...',
    all_categories: 'அனைத்து பிரிவுகளும்',
    sort_by: 'வரிசைப்படுத்து: சிறப்பு',
    trending_categories: 'பிரபலமான வகைகள்',
    featured_products: 'சிறப்புப் பொருட்கள்',
    why_choose_us: 'ShopEase-ஐ ஏன் தேர்வு செய்ய வேண்டும்?',
    hero_title: 'ShopEase உடன் உங்கள் வாழ்க்கை முறையை மேம்படுத்துங்கள்',
    hero_subtitle: 'மின்னணுவியல், ஆடை வடிவமைப்பு மற்றும் வீட்டு அத்தியாவசியப் பொருட்களின் சிறந்த தொகுப்புகளை வேகமான டெலிவரியுடன் கண்டறியுங்கள்.',
    hero_shop_now: 'இப்போதே வாங்குங்கள் 🛍️',
    hero_explore: 'சலுகைகளை ஆராயுங்கள் ⚡',
    save_changes: 'மாற்றங்களைச் சேமி',
    full_name: 'முழு பெயர்',
    email_address: 'மின்னஞ்சல் முகவரி',
    phone_number: 'தொலைபேசி எண்',
    choose_avatar_preset: 'கீழே உள்ள சுயவிவர அவதாரத்தைத் தேர்ந்தெடுக்கவும் அல்லது URL உள்ளிடவும்:',
    logout_confirm_title: 'நீங்கள் நிச்சயமாக வெளியேற விரும்புகிறீர்களா?',
    logout_confirm_desc: 'உங்கள் சுயவிவரம் மற்றும் ஆர்டர்களை அணுக மீண்டும் உள்நுழைய வேண்டும்.',
    cancel: 'ரத்து செய்',
    confirm_logout: 'வெளியேறு',
    lang_updated: 'மொழி தமிழ் என புதுப்பிக்கப்பட்டது 🌐',
    logged_out_msg: 'வெற்றிகரமாக வெளியேறியது 👋'
  },
  'हिन्दी (Hindi)': {
    nav_home: '🏠 होम',
    nav_products: '📦 उत्पाद',
    nav_cart: '🛒 कार्ट',
    nav_signin: 'साइन इन',
    my_profile: 'मेरी प्रोफ़ाइल',
    edit_profile: 'प्रोफ़ाइल संपादित करें',
    orders_purchases: 'ऑर्डर / खरीदारी',
    language: 'भाषा',
    currency: 'मुद्रा',
    delivery_address: 'डिलीवरी का पता',
    log_out: 'लॉग आउट',
    app_version: 'ऐप संस्करण 2.3',
    view_details: 'विवरण देखें',
    add_to_cart: 'कार्ट में जोड़ें',
    in_stock: 'स्टॉक में है',
    out_of_stock: 'स्टॉक खत्म',
    search_placeholder: 'उत्पाद या श्रेणियां खोजें...',
    all_categories: 'सभी श्रेणियां',
    sort_by: 'क्रमबद्ध करें: विशेष',
    trending_categories: 'ट्रेंडिंग श्रेणियां',
    featured_products: 'विशेष रुप से प्रदर्शित उत्पाद',
    why_choose_us: 'ShopEase क्यों चुनें?',
    hero_title: 'ShopEase के साथ अपनी जीवनशैली को बेहतर बनाएं',
    hero_subtitle: 'प्रीमियम इलेक्ट्रॉनिक्स, फैशन और घरेलू जरूरी सामानों के क्यूरेटेड संग्रह खोजें।',
    hero_shop_now: 'अभी खरीदें 🛍️',
    hero_explore: 'ऑफ़र देखें ⚡',
    save_changes: 'परिवर्तन सहेजें',
    full_name: 'पूरा नाम',
    email_address: 'ईमेल पता',
    phone_number: 'फ़ोन नंबर',
    choose_avatar_preset: 'नीचे एक अवतार प्रीसेट चुनें या एक छवि URL दर्ज करें:',
    logout_confirm_title: 'क्या आप निश्चित रूप से लॉग आउट करना चाहते हैं?',
    logout_confirm_desc: 'अपनी प्रोफ़ाइल और ऑर्डर देखने के लिए आपको फिर से साइन इन करना होगा।',
    cancel: 'रद्द करें',
    confirm_logout: 'लॉग आउट',
    lang_updated: 'भाषा हिन्दी में अपडेट की गई 🌐',
    logged_out_msg: 'सफलतापूर्वक लॉग आउट किया गया 👋'
  },
  'Español (Spanish)': {
    nav_home: '🏠 Inicio',
    nav_products: '📦 Productos',
    nav_cart: '🛒 Carrito',
    nav_signin: 'Iniciar sesión',
    my_profile: 'Mi Perfil',
    edit_profile: 'Editar perfil',
    orders_purchases: 'Pedidos / Compras',
    language: 'Idioma',
    currency: 'Moneda',
    delivery_address: 'Dirección de entrega',
    log_out: 'Cerrar sesión',
    app_version: 'Versión de la aplicación 2.3',
    view_details: 'Ver detalles',
    add_to_cart: 'Añadir al carrito',
    in_stock: 'En stock',
    out_of_stock: 'Agotado',
    search_placeholder: 'Buscar productos...',
    all_categories: 'Todas las categorías',
    sort_by: 'Ordenar por: Destacados',
    trending_categories: 'Categorías populares',
    featured_products: 'Productos destacados',
    why_choose_us: '¿Por qué elegir ShopEase?',
    hero_title: 'Mejora tu estilo de vida con ShopEase',
    hero_subtitle: 'Descubre colecciones seleccionadas de electrónica, moda y hogar con entrega rápida.',
    hero_shop_now: 'Comprar ahora 🛍️',
    hero_explore: 'Explorar ofertas ⚡',
    save_changes: 'Guardar cambios',
    full_name: 'Nombre completo',
    email_address: 'Correo electrónico',
    phone_number: 'Número de teléfono',
    choose_avatar_preset: 'Elige un ajuste preestablecido de avatar a continuación o ingresa una URL:',
    logout_confirm_title: '¿Estás seguro de que deseas cerrar sesión?',
    logout_confirm_desc: 'Deberás iniciar sesión nuevamente para acceder a tu perfil y pedidos.',
    cancel: 'Cancelar',
    confirm_logout: 'Cerrar sesión',
    lang_updated: 'Idioma actualizado a Español 🌐',
    logged_out_msg: 'Sesión cerrada con éxito 👋'
  },
  'Français (French)': {
    nav_home: '🏠 Accueil',
    nav_products: '📦 Produits',
    nav_cart: '🛒 Panier',
    nav_signin: 'Se connecter',
    my_profile: 'Mon Profil',
    edit_profile: 'Modifier le profil',
    orders_purchases: 'Commandes / Achats',
    language: 'Langue',
    currency: 'Devise',
    delivery_address: 'Adresse de livraison',
    log_out: 'Se déconnecter',
    app_version: 'Version de l\'application 2.3',
    view_details: 'Voir les détails',
    add_to_cart: 'Ajouter au panier',
    in_stock: 'En stock',
    out_of_stock: 'Rupture de stock',
    search_placeholder: 'Rechercher des produits...',
    all_categories: 'Toutes les catégories',
    sort_by: 'Trier par : En vedette',
    trending_categories: 'Catégories tendance',
    featured_products: 'Produits en vedette',
    why_choose_us: 'Pourquoi choisir ShopEase ?',
    hero_title: 'Améliorez votre style de vie avec ShopEase',
    hero_subtitle: 'Découvrez des collections de produits électroniques, de mode et d\'articles pour la maison.',
    hero_shop_now: 'Acheter maintenant 🛍️',
    hero_explore: 'Explorer les offres ⚡',
    save_changes: 'Enregistrer les modifications',
    full_name: 'Nom complet',
    email_address: 'Adresse e-mail',
    phone_number: 'Numéro de téléphone',
    choose_avatar_preset: 'Choisissez un avatar prédéfini ci-dessous ou entrez une URL :',
    logout_confirm_title: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    logout_confirm_desc: 'Vous devrez vous reconnecter pour accéder à votre profil et à vos commandes.',
    cancel: 'Annuler',
    confirm_logout: 'Se déconnecter',
    lang_updated: 'Langue mise à jour en Français 🌐',
    logged_out_msg: 'Déconnecté avec succès 👋'
  },
  'Deutsch (German)': {
    nav_home: '🏠 Startseite',
    nav_products: '📦 Produkte',
    nav_cart: '🛒 Warenkorb',
    nav_signin: 'Anmelden',
    my_profile: 'Mein Profil',
    edit_profile: 'Profil bearbeiten',
    orders_purchases: 'Bestellungen / Einkäufe',
    language: 'Sprache',
    currency: 'Währung',
    delivery_address: 'Lieferadresse',
    log_out: 'Abmelden',
    app_version: 'App-Version 2.3',
    view_details: 'Details anzeigen',
    add_to_cart: 'In den Warenkorb',
    in_stock: 'Vorrätig',
    out_of_stock: 'Ausverkauft',
    search_placeholder: 'Produkte suchen...',
    all_categories: 'Alle Kategorien',
    sort_by: 'Sortieren nach: Beliebt',
    trending_categories: 'Beliebte Kategorien',
    featured_products: 'Ausgewählte Produkte',
    why_choose_us: 'Warum ShopEase wählen?',
    hero_title: 'Verbessern Sie Ihren Lebensstil mit ShopEase',
    hero_subtitle: 'Entdecken Sie kuratierte Kollektionen aus Elektronik, Mode und Lifestyle-Artikeln.',
    hero_shop_now: 'Jetzt einkaufen 🛍️',
    hero_explore: 'Angebote entdecken ⚡',
    save_changes: 'Änderungen speichern',
    full_name: 'Vollständiger Name',
    email_address: 'E-Mail-Adresse',
    phone_number: 'Telefonnummer',
    choose_avatar_preset: 'Wählen Sie unten eine Avatar-Voreinstellung oder geben Sie eine URL ein:',
    logout_confirm_title: 'Möchten Sie sich wirklich abmelden?',
    logout_confirm_desc: 'Sie müssen sich erneut anmelden, um auf Ihr Profil zuzugreifen.',
    cancel: 'Abbrechen',
    confirm_logout: 'Abmelden',
    lang_updated: 'Sprache auf Deutsch aktualisiert 🌐',
    logged_out_msg: 'Erfolgreich abgemeldet 👋'
  },
  'العربية (Arabic)': {
    nav_home: '🏠 الرئيسية',
    nav_products: '📦 المنتجات',
    nav_cart: '🛒 السلة',
    nav_signin: 'تسجيل الدخول',
    my_profile: 'ملفي الشخصي',
    edit_profile: 'تعديل الملف الشخصي',
    orders_purchases: 'الطلبات / المشتريات',
    language: 'اللغة',
    currency: 'العملة',
    delivery_address: 'عنوان التوصيل',
    log_out: 'تسجيل الخروج',
    app_version: 'إصدار التطبيق 2.3',
    view_details: 'عرض التفاصيل',
    add_to_cart: 'أضف إلى السلة',
    in_stock: 'متوفر',
    out_of_stock: 'غير متوفر',
    search_placeholder: 'ابحث عن منتجات...',
    all_categories: 'جميع الفئات',
    sort_by: 'ترتيب حسب: المميز',
    trending_categories: 'الفئات الشائعة',
    featured_products: 'المنتجات المميزة',
    why_choose_us: 'لماذا تختار ShopEase؟',
    hero_title: 'ارتقِ بأسلوب حياتك مع ShopEase',
    hero_subtitle: 'اكتشف مجموعات مميزة من الإلكترونيات والأزياء ومستلزمات المنزل.',
    hero_shop_now: 'تسوق الآن 🛍️',
    hero_explore: 'استكشف العروض ⚡',
    save_changes: 'حفظ التغييرات',
    full_name: 'الاسم الكامل',
    email_address: 'البريد الإلكتروني',
    phone_number: 'رقم الهاتف',
    choose_avatar_preset: 'اختر صورة رمزية جاهزة أدناه أو أدخل رابط صورة:',
    logout_confirm_title: 'هل أنت متأكد أنك تريد تسجيل الخروج؟',
    logout_confirm_desc: 'ستحتاج إلى تسجيل الدخول مرة أخرى للوصول إلى ملفك الشخصي وطلباتك.',
    cancel: 'إلغاء',
    confirm_logout: 'تسجيل الخروج',
    lang_updated: 'تم تحديث اللغة إلى العربية 🌐',
    logged_out_msg: 'تم تسجيل الخروج بنجاح 👋'
  }
};

/**
 * Get translation string for a key
 */
function t(key, lang = getStoredLang()) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS['English'];
  return dict[key] || TRANSLATIONS['English'][key] || key;
}

/**
 * Get ISO language code
 */
function getLangCode(lang) {
  const codes = {
    'English': 'en',
    'தமிழ் (Tamil)': 'ta',
    'हिन्दी (Hindi)': 'hi',
    'Español (Spanish)': 'es',
    'Français (French)': 'fr',
    'Deutsch (German)': 'de',
    'العربية (Arabic)': 'ar'
  };
  return codes[lang] || 'en';
}

/**
 * Apply selected language globally across the entire app
 */
function applyAppLanguage(lang = getStoredLang()) {
  const currentLang = lang || 'English';
  document.documentElement.setAttribute('lang', getLangCode(currentLang));
  if (currentLang === 'العربية (Arabic)') {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }

  // 1. Elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = t(key, currentLang);
    if (translation) el.textContent = translation;
  });

  // 2. Elements with data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translation = t(key, currentLang);
    if (translation) el.placeholder = translation;
  });

  // 3. Navbar Navigation Items
  const navItems = document.querySelectorAll('.nav-links .nav-item');
  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (href === 'index.html' || href === '/') {
      item.textContent = t('nav_home', currentLang);
    } else if (href === 'products.html') {
      item.textContent = t('nav_products', currentLang);
    } else if (href === 'cart.html') {
      const countEl = item.querySelector('.cart-count');
      const countVal = countEl ? countEl.textContent : '0';
      item.innerHTML = `${t('nav_cart', currentLang)} <span class="cart-count" id="cart-count">${countVal}</span>`;
    }
  });

  // 4. Badges on Profile Page and Drawer
  const pageLangBadge = document.getElementById('page-lang-badge');
  if (pageLangBadge) pageLangBadge.textContent = currentLang;
  const drawerLangBadge = document.getElementById('drawer-lang-badge');
  if (drawerLangBadge) drawerLangBadge.textContent = currentLang;

  // 5. Profile Page & Drawer Headings and Titles
  document.querySelectorAll('.profile-panel-title').forEach(el => el.textContent = t('my_profile', currentLang));
  document.querySelectorAll('.profile-edit-btn').forEach(el => el.textContent = t('edit_profile', currentLang));
  
  // Profile menu items labels
  document.querySelectorAll('.profile-menu-item').forEach(btn => {
    const label = btn.querySelector('.profile-item-label');
    if (!label) return;
    const text = label.textContent.trim();
    if (text.includes('Orders') || text.includes('ஆர்டர்கள்') || text.includes('ऑर्डर') || text.includes('Pedidos') || text.includes('Commandes') || text.includes('Bestellungen') || text.includes('الطلبات')) {
      label.textContent = t('orders_purchases', currentLang);
    } else if (text.includes('Language') || text.includes('மொழி') || text.includes('भाषा') || text.includes('Idioma') || text.includes('Langue') || text.includes('Sprache') || text.includes('اللغة')) {
      label.textContent = t('language', currentLang);
    } else if (text.includes('Currency') || text.includes('நாணயம்') || text.includes('मुद्रा') || text.includes('Moneda') || text.includes('Devise') || text.includes('Währung') || text.includes('العملة')) {
      label.textContent = t('currency', currentLang);
    } else if (text.includes('Delivery Address') || text.includes('டெலிவரி') || text.includes('डिलीवरी') || text.includes('Dirección') || text.includes('Adresse de livraison') || text.includes('Lieferadresse') || text.includes('عنوان التوصيل')) {
      label.textContent = t('delivery_address', currentLang);
    } else if (text.includes('Log Out') || text.includes('வெளியேறு') || text.includes('लॉग आउट') || text.includes('Cerrar sesión') || text.includes('Se déconnecter') || text.includes('Abmelden') || text.includes('تسجيل الخروج')) {
      label.textContent = t('log_out', currentLang);
    }
  });

  // Profile Footer
  document.querySelectorAll('.profile-panel-footer span').forEach(el => el.textContent = t('app_version', currentLang));

  // 6. Action buttons across cards
  document.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.textContent = t('view_details', currentLang);
  });
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.innerHTML = `<span class="cart-btn-icon">🛒</span> ${t('add_to_cart', currentLang)}`;
  });
}

// ============================================================
// AUTHENTICATION & USER PROFILE DRAWER
// ============================================================

const DEFAULT_USER = {
  name: 'Arun',
  email: 'arunmathesh08@gmail.com',
  phone: '+91 98765 43210',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
};

/**
 * Get current logged in user from localStorage
 * @returns {Object|null}
 */
function getCurrentUser() {
  try {
    const isLoggedOut = localStorage.getItem('shopease_logged_out') === 'true';
    if (isLoggedOut) {
      return null;
    }
    const userStr = localStorage.getItem('shopease_user');
    if (!userStr) {
      // First visit before any explicit login or logout: default to Arun
      localStorage.setItem('shopease_user', JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(userStr);
    if (!parsed || !parsed.name) return null;
    if (!parsed.avatar) {
      parsed.avatar = DEFAULT_USER.avatar;
    }
    if (parsed.name === 'Arunmathesh08') {
      parsed.name = 'Arun';
      localStorage.setItem('shopease_user', JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error('Error reading auth state:', e);
    return null;
  }
}

/**
 * Set logged in user
 * @param {Object} user - { name, email, avatar, phone }
 */
function setCurrentUser(user) {
  try {
    localStorage.removeItem('shopease_logged_out');
    const current = getCurrentUser() || DEFAULT_USER;
    const updated = { ...current, ...user };
    localStorage.setItem('shopease_user', JSON.stringify(updated));
    recordActivity('👤', `Profile updated (${updated.name})`);
    initAuth();
  } catch (e) {
    console.error('Error saving user:', e);
  }
}

/**
 * Prompt Confirmation Dialog for Log Out
 */
function promptLogout() {
  closeProfileDrawer();
  ensureProfilePanelElements();
  const currentLang = getStoredLang();
  
  const modalHtml = `
    <div class="profile-modal-backdrop active" id="logout-confirm-modal" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card" style="max-width: 400px; text-align: center;">
        <div class="profile-modal-header" style="justify-content: center; position: relative; border-bottom: none; padding-bottom: 0;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: #fee2e2; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; margin-top: 8px;">
            🚪
          </div>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()" style="position: absolute; right: 16px; top: 16px;" aria-label="Close">✕</button>
        </div>
        <div class="profile-modal-body" style="padding: 16px 24px 24px;">
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--gray-900); margin-bottom: 8px;">
            ${t('logout_confirm_title', currentLang)}
          </h3>
          <p style="font-size: 0.925rem; color: var(--gray-500); margin-bottom: 24px; line-height: 1.5;">
            ${t('logout_confirm_desc', currentLang)}
          </p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button type="button" class="btn btn-secondary" onclick="closeAllProfileModals()" style="flex: 1; padding: 11px 20px; font-weight: 600; border-radius: var(--radius-lg);">
              ${t('cancel', currentLang)}
            </button>
            <button type="button" class="btn btn-danger" onclick="confirmLogout()" style="flex: 1; padding: 11px 20px; font-weight: 600; background: #ef4444; border-color: #ef4444; color: #fff; border-radius: var(--radius-lg); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);">
              ${t('confirm_logout', currentLang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

/**
 * Confirm and Execute Log Out
 */
function confirmLogout() {
  try {
    const currentLang = getStoredLang();
    localStorage.removeItem('shopease_user');
    localStorage.removeItem('shopease_token');
    localStorage.setItem('shopease_logged_out', 'true');
    closeProfileDrawer();
    closeAllProfileModals();
    showNotification(t('logged_out_msg', currentLang) || 'Logged out successfully 👋', 'success');
    initAuth();

    // If on login page, re-render form
    if (typeof renderAuthState === 'function') {
      renderAuthState();
    }

    // Redirect to login page and prevent navigating back to authenticated profile
    setTimeout(() => {
      window.location.replace('login.html');
    }, 450);
  } catch (err) {
    console.error('Logout error:', err);
    showNotification('Failed to log out. Please try again.', 'error');
  }
}

/**
 * Log out user entry point (triggers confirmation dialog)
 */
function logoutUser() {
  promptLogout();
}

/**
 * Get saved orders list from localStorage
 */
function getStoredOrders() {
  try {
    const orders = localStorage.getItem('shopease_orders');
    if (orders) return JSON.parse(orders);
    
    // Seed sample orders for Arun
    const sampleOrders = [
      {
        orderId: 'SE-98421',
        date: 'Sep 15, 2026, 02:30 PM',
        status: 'Delivered',
        statusClass: 'delivered',
        statusIcon: '✅',
        total: 1999,
        paymentMethod: 'Demo Card Payment',
        items: [
          {
            name: 'Wireless Headphones',
            price: 1999,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'
          }
        ]
      },
      {
        orderId: 'SE-87103',
        date: 'Sep 10, 2026, 11:15 AM',
        status: 'Delivered',
        statusClass: 'delivered',
        statusIcon: '✅',
        total: 2499,
        paymentMethod: 'Cash on Delivery',
        items: [
          {
            name: 'Smart Watch Fitness Tracker',
            price: 2799,
            quantity: 1,
            image: '/images/products/sku-el-002.jpg'
          }
        ]
      }
    ];
    localStorage.setItem('shopease_orders', JSON.stringify(sampleOrders));
    return sampleOrders;
  } catch (e) {
    return [];
  }
}

/**
 * Get user activity history
 */
function getStoredActivity() {
  try {
    const act = localStorage.getItem('shopease_activity');
    if (act) return JSON.parse(act);

    const defaultActivity = [
      { icon: '📦', title: 'Order #SE-98421 delivered successfully', time: 'Yesterday at 02:30 PM' },
      { icon: '🛒', title: 'Added Smart Watch to cart', time: '3 days ago' },
      { icon: '👤', title: 'Profile updated (Arun)', time: '5 days ago' },
      { icon: '🌐', title: 'Language set to English', time: '1 week ago' },
      { icon: '🚪', title: 'Signed in from Chrome on Windows', time: '1 week ago' }
    ];
    localStorage.setItem('shopease_activity', JSON.stringify(defaultActivity));
    return defaultActivity;
  } catch (e) {
    return [];
  }
}

/**
 * Record a user activity item
 */
function recordActivity(icon, title) {
  try {
    const list = getStoredActivity();
    list.unshift({
      icon: icon || '✨',
      title: title,
      time: 'Just now'
    });
    localStorage.setItem('shopease_activity', JSON.stringify(list.slice(0, 20)));
  } catch (e) {}
}

/**
 * Get stored delivery address
 */
function getStoredAddress() {
  try {
    const addr = localStorage.getItem('shopease_address');
    return addr ? JSON.parse(addr) : {
      address: '42 Park Avenue, Apartment 5B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001'
    };
  } catch (e) {
    return {
      address: '42 Park Avenue, Apartment 5B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001'
    };
  }
}

/**
 * Get stored preferred language
 */
function getStoredLang() {
  return localStorage.getItem('shopease_lang') || 'English';
}

/**
 * Ensure the Profile Drawer and Modals DOM elements are present
 */
function ensureProfilePanelElements() {
  if (!document.getElementById('profile-modals-container')) {
    const modalsContainer = document.createElement('div');
    modalsContainer.id = 'profile-modals-container';
    document.body.appendChild(modalsContainer);
  }

  if (document.getElementById('profile-drawer')) {
    return;
  }

  // Inject Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'profile-drawer-backdrop';
  backdrop.className = 'profile-drawer-backdrop';
  backdrop.onclick = () => closeProfileDrawer();
  document.body.appendChild(backdrop);

  // Inject Drawer
  const drawer = document.createElement('aside');
  drawer.id = 'profile-drawer';
  drawer.className = 'profile-drawer';
  drawer.setAttribute('aria-label', 'User Profile Menu');
  drawer.innerHTML = `
    <!-- Top Header Bar -->
    <div class="profile-panel-header">
      <button type="button" class="profile-icon-btn profile-close-btn" onclick="closeProfileDrawer()" aria-label="Close Profile">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h2 class="profile-panel-title">My Profile</h2>
      <button type="button" class="profile-icon-btn profile-settings-btn" onclick="toggleTheme()" aria-label="Settings" title="Toggle Theme (Dark / Light)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>

    <!-- User Profile Header -->
    <div class="profile-user-section">
      <div class="profile-avatar-wrapper">
        <img src="${DEFAULT_USER.avatar}" alt="User Avatar" class="profile-avatar-img" id="drawer-avatar-img">
        <label for="drawer-avatar-input" class="profile-avatar-badge" title="Change Photo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </label>
        <input type="file" id="drawer-avatar-input" accept="image/*" style="display:none;" onchange="handleAvatarFileSelect(event)">
      </div>
      <div class="profile-user-info">
        <h3 class="profile-user-name" id="drawer-user-name">${DEFAULT_USER.name}</h3>
        <p class="profile-user-email" id="drawer-user-email">${DEFAULT_USER.email}</p>
        <button type="button" class="profile-edit-btn" onclick="openEditProfileModal()">Edit Profile</button>
      </div>
    </div>

    <!-- Section 1: Orders / Purchases -->
    <div class="profile-menu-section">
      <button type="button" class="profile-menu-item" onclick="openOrdersModal()">
        <div class="profile-item-left">
          <span class="profile-item-icon">📦</span>
          <span class="profile-item-label">Orders / Purchases</span>
        </div>
        <span class="profile-item-arrow">›</span>
      </button>
    </div>

    <div class="profile-divider"></div>

    <!-- Section 2: Preferences (Language, Currency & Delivery Address) -->
    <div class="profile-menu-section">
      <button type="button" class="profile-menu-item" onclick="openLanguageModal()" aria-label="Change Language">
        <div class="profile-item-left">
          <span class="profile-item-icon">🌐</span>
          <span class="profile-item-label">Language</span>
        </div>
        <div class="profile-item-right">
          <span class="profile-item-badge" id="drawer-lang-badge">English</span>
          <span class="profile-item-arrow">›</span>
        </div>
      </button>

      <button type="button" class="profile-menu-item" onclick="openCurrencyModal()" aria-label="Change Currency">
        <div class="profile-item-left">
          <span class="profile-item-icon">💱</span>
          <span class="profile-item-label">Currency</span>
        </div>
        <div class="profile-item-right">
          <span class="profile-item-badge" id="drawer-currency-badge">USD $</span>
          <span class="profile-item-arrow">›</span>
        </div>
      </button>

      <button type="button" class="profile-menu-item" onclick="openAddressModal()" aria-label="Delivery Address">
        <div class="profile-item-left">
          <span class="profile-item-icon">📍</span>
          <span class="profile-item-label">Delivery Address</span>
        </div>
        <span class="profile-item-arrow">›</span>
      </button>
    </div>

    <div class="profile-divider"></div>

    <!-- Section 3: Account (Log Out) -->
    <div class="profile-menu-section">
      <button type="button" class="profile-menu-item text-danger" onclick="logoutUser()">
        <div class="profile-item-left">
          <span class="profile-item-icon">🚪</span>
          <span class="profile-item-label">Log Out</span>
        </div>
        <span class="profile-item-arrow">›</span>
      </button>
    </div>

    <div class="profile-divider"></div>

    <!-- Footer -->
    <div class="profile-panel-footer">
      <span>App Version 2.3</span>
    </div>
  `;
  document.body.appendChild(drawer);

  // Inject Profile Modals Container
  const modalsContainer = document.createElement('div');
  modalsContainer.id = 'profile-modals-container';
  document.body.appendChild(modalsContainer);

  // Add global keyboard listener for Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProfileDrawer();
      closeAllProfileModals();
    }
  });
}

/**
 * Open the Profile Side Panel
 */
function openProfileDrawer() {
  ensureProfilePanelElements();
  updateProfileDrawerContent();

  const backdrop = document.getElementById('profile-drawer-backdrop');
  const drawer = document.getElementById('profile-drawer');

  if (backdrop && drawer) {
    backdrop.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close the Profile Side Panel
 */
function closeProfileDrawer() {
  const backdrop = document.getElementById('profile-drawer-backdrop');
  const drawer = document.getElementById('profile-drawer');

  if (backdrop && drawer) {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Toggle the Profile Side Panel
 */
function toggleProfileDrawer(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const drawer = document.getElementById('profile-drawer');
  if (drawer && drawer.classList.contains('active')) {
    closeProfileDrawer();
  } else {
    openProfileDrawer();
  }
}

/**
 * Update dynamic text & avatar inside drawer
 */
function updateProfileDrawerContent() {
  const user = getCurrentUser();
  if (!user) return;

  const avatarImg = document.getElementById('drawer-avatar-img');
  const nameEl = document.getElementById('drawer-user-name');
  const emailEl = document.getElementById('drawer-user-email');
  const langBadge = document.getElementById('drawer-lang-badge');
  const currBadge = document.getElementById('drawer-currency-badge');

  if (avatarImg) avatarImg.src = user.avatar || DEFAULT_USER.avatar;
  if (nameEl) nameEl.textContent = user.name || 'Arun';
  if (emailEl) emailEl.textContent = user.email || 'arunmathesh08@gmail.com';
  if (langBadge) langBadge.textContent = getStoredLang();
  if (currBadge) {
    const curr = getStoredCurrency();
    currBadge.textContent = (CURRENCIES[curr] && CURRENCIES[curr].label) || `${curr} $`;
  }
}

/**
 * Handle custom avatar image upload from device
 */
function handleAvatarFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64 = event.target.result;
    setCurrentUser({ avatar: base64 });
    showNotification('Avatar photo updated! 📸', 'success');
  };
  reader.readAsDataURL(file);
}

// ============================================================
// PROFILE ACTION MODALS
// ============================================================

function closeAllProfileModals() {
  const backdrop = document.querySelector('.profile-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('active');
    setTimeout(() => backdrop.remove(), 250);
  }
}

// Avatar Presets (Reference Image 2)
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces'
];

/**
 * Handle avatar preset selection
 */
function selectAvatarPreset(url, el) {
  const preview = document.getElementById('modal-avatar-preview');
  if (preview) {
    preview.src = url;
  }
  const input = document.getElementById('edit-profile-avatar');
  if (input) {
    input.value = url;
  }
  document.querySelectorAll('#avatar-presets-container .avatar-preset-item').forEach(btn => {
    btn.classList.remove('active');
  });
  if (el) {
    el.classList.add('active');
  }
}

/**
 * Open Edit Profile Modal
 */
function openEditProfileModal() {
  ensureProfilePanelElements();
  closeProfileDrawer();
  const user = getCurrentUser() || DEFAULT_USER;
  const currentAvatar = user.avatar || AVATAR_PRESETS[0];

  // Determine active preset (defaults to first preset if no match)
  const activePresetIndex = AVATAR_PRESETS.findIndex(p => p === currentAvatar);
  const selectedIndex = activePresetIndex >= 0 ? activePresetIndex : 0;

  const modalHtml = `
    <div class="profile-modal-backdrop active" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card" style="max-width: 480px;">
        <div class="profile-modal-header">
          <h3 class="profile-modal-title"><span>✏️</span> Edit Profile</h3>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()" aria-label="Close modal">✕</button>
        </div>
        <form onsubmit="handleSaveProfile(event)" id="edit-profile-form">
          <div class="profile-modal-body" style="padding: 24px;">
            
            <!-- Large circular profile avatar with subtle glow ring -->
            <div style="text-align: center; margin-top: 4px;">
              <div class="modal-main-avatar-wrapper">
                <img src="${currentAvatar}" id="modal-avatar-preview" class="modal-main-avatar-img" alt="Avatar Preview" onerror="this.src='${AVATAR_PRESETS[0]}'">
              </div>
            </div>

            <!-- Centered helper text -->
            <p class="avatar-selection-heading">Choose an avatar preset below or enter an image URL:</p>

            <!-- 4 circular avatar preset options -->
            <div class="avatar-presets-row" id="avatar-presets-container">
              ${AVATAR_PRESETS.map((url, idx) => `
                <button type="button" 
                  class="avatar-preset-item ${idx === selectedIndex ? 'active' : ''}" 
                  onclick="selectAvatarPreset('${url}', this)" 
                  aria-label="Select avatar preset ${idx + 1}">
                  <img src="${url}" class="avatar-preset-thumb" alt="Avatar Option ${idx + 1}">
                </button>
              `).join('')}
            </div>

            <input type="hidden" id="edit-profile-avatar" value="${currentAvatar}">

            <div class="form-group" style="margin-bottom: 16px;">
              <label for="edit-profile-name">Full Name <span class="required" style="color: var(--error, #ef4444);">*</span></label>
              <input type="text" id="edit-profile-name" value="${user.name || 'Arun'}" required placeholder="Enter full name">
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label for="edit-profile-email">Email Address <span class="required" style="color: var(--error, #ef4444);">*</span></label>
              <input type="email" id="edit-profile-email" value="${user.email || 'arunmathesh08@gmail.com'}" required placeholder="Enter email address">
            </div>

            <div class="form-group" style="margin-bottom: 24px;">
              <label for="edit-profile-phone">Phone Number</label>
              <input type="tel" id="edit-profile-phone" value="${user.phone || '+91 98765 43210'}" placeholder="+91 98765 43210">
            </div>

            <div style="display: flex; justify-content: center; align-items: center; margin-top: 24px; padding-bottom: 4px;">
              <button type="submit" class="btn btn-primary" style="min-width: 200px; padding: 12px 36px; font-size: 0.95rem; font-weight: 600; border-radius: var(--radius-full, 9999px); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35); border: none;">
                Save Changes
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

function handleSaveProfile(e) {
  e.preventDefault();
  const name = document.getElementById('edit-profile-name').value.trim();
  const email = document.getElementById('edit-profile-email').value.trim();
  const phone = document.getElementById('edit-profile-phone').value.trim();
  const avatarInput = document.getElementById('edit-profile-avatar');
  const avatar = avatarInput ? avatarInput.value.trim() : null;
  const currentUser = getCurrentUser() || DEFAULT_USER;

  setCurrentUser({
    ...currentUser,
    name: name || currentUser.name,
    email: email || currentUser.email,
    phone: phone || currentUser.phone,
    avatar: avatar || currentUser.avatar || AVATAR_PRESETS[0]
  });
  closeAllProfileModals();
  if (typeof syncPageProfile === 'function') {
    syncPageProfile();
  }
  showNotification('Profile updated successfully! ✅', 'success');
}

/**
 * Open Orders / Purchases Modal
 */
function openOrdersModal() {
  closeProfileDrawer();
  const orders = getStoredOrders();

  let ordersListHtml = '';
  if (orders.length === 0) {
    ordersListHtml = `
      <div class="empty-state" style="padding: 30px 20px;">
        <span class="empty-icon">📦</span>
        <h4 style="margin: 10px 0 6px;">No Orders Yet</h4>
        <p style="color: var(--gray-500); font-size: 0.9rem;">You haven't placed any orders yet.</p>
        <a href="products.html" class="btn btn-primary btn-sm" style="margin-top: 12px;" onclick="closeAllProfileModals()">Shop Products</a>
      </div>
    `;
  } else {
    ordersListHtml = `
      <div class="profile-orders-list">
        ${orders.map(order => `
          <div class="profile-order-card">
            <div class="profile-order-header">
              <div>
                <span class="profile-order-id">#${order.orderId}</span>
                <div class="profile-order-date">${order.date}</div>
              </div>
              <span class="profile-order-badge ${order.statusClass || 'delivered'}">${order.statusIcon || '✅'} ${order.status}</span>
            </div>
            <div class="profile-order-items">
              ${order.items.map(item => `
                <div class="profile-order-item-row">
                  <img src="${item.image}" alt="${item.name}" class="profile-order-item-thumb">
                  <div class="profile-order-item-info">
                    <div class="profile-order-item-name">${item.name}</div>
                    <div class="profile-order-item-meta">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--gray-200);">
              <span style="font-size: 0.85rem; color: var(--gray-500);">${order.paymentMethod || 'Paid Online'}</span>
              <span class="profile-order-total">Total: ${formatPrice(order.total)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const modalHtml = `
    <div class="profile-modal-backdrop active" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card" style="max-width: 580px;">
        <div class="profile-modal-header">
          <h3 class="profile-modal-title"><span>📦</span> Orders & Purchases</h3>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()">✕</button>
        </div>
        <div class="profile-modal-body">
          ${ordersListHtml}
        </div>
        <div class="profile-modal-footer">
          <a href="products.html" class="btn btn-primary" onclick="closeAllProfileModals()">Browse More Items</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

/**
 * Open Activity History Modal
 */
function openActivityHistoryModal() {
  closeProfileDrawer();
  const activities = getStoredActivity();

  const modalHtml = `
    <div class="profile-modal-backdrop active" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card">
        <div class="profile-modal-header">
          <h3 class="profile-modal-title"><span>🕘</span> Order & Activity History</h3>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()">✕</button>
        </div>
        <div class="profile-modal-body">
          <div class="profile-activity-list">
            ${activities.map(act => `
              <div class="profile-activity-item">
                <span class="profile-activity-icon">${act.icon}</span>
                <div class="profile-activity-content">
                  <div class="profile-activity-title">${act.title}</div>
                  <div class="profile-activity-time">${act.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="profile-modal-footer">
          <button type="button" class="btn btn-secondary" onclick="clearActivityHistory()">Clear History</button>
          <button type="button" class="btn btn-primary" onclick="closeAllProfileModals()">Done</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

function clearActivityHistory() {
  localStorage.setItem('shopease_activity', JSON.stringify([]));
  closeAllProfileModals();
  showNotification('Activity history cleared 🧹', 'success');
}

/**
 * Open Language Selector Modal
 */
function openLanguageModal() {
  closeProfileDrawer();
  ensureProfilePanelElements();
  const currentLang = getStoredLang();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
    { code: 'ar', name: 'العربية (Arabic)', flag: '🇦🇪' }
  ];

  const modalHtml = `
    <div class="profile-modal-backdrop active" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card" style="max-width: 440px;">
        <div class="profile-modal-header">
          <h3 class="profile-modal-title"><span>🌐</span> ${t('language', currentLang)}</h3>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()" aria-label="Close">✕</button>
        </div>
        <div class="profile-modal-body" style="padding: 20px;">
          <div class="profile-lang-grid">
            ${languages.map(lang => `
              <button type="button" class="profile-lang-btn ${currentLang === lang.name ? 'active' : ''}" onclick="selectLanguage('${lang.name}')">
                <span>${lang.flag} ${lang.name}</span>
                ${currentLang === lang.name ? '<span>✓</span>' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

function selectLanguage(lang) {
  localStorage.setItem('shopease_lang', lang);
  recordActivity('🌐', `Language set to ${lang}`);
  closeAllProfileModals();
  applyAppLanguage(lang);
  updateProfileDrawerContent();
  if (typeof syncPageProfile === 'function') {
    syncPageProfile();
  }
  showNotification(t('lang_updated', lang) || `Language set to ${lang} 🌐`, 'success');
}

/**
 * Open Delivery Address Modal
 */
function openAddressModal() {
  closeProfileDrawer();
  const address = getStoredAddress();

  const modalHtml = `
    <div class="profile-modal-backdrop active" onclick="if(event.target === this) closeAllProfileModals()">
      <div class="profile-modal-card">
        <div class="profile-modal-header">
          <h3 class="profile-modal-title"><span>📍</span> Delivery Address</h3>
          <button type="button" class="profile-icon-btn" onclick="closeAllProfileModals()">✕</button>
        </div>
        <form onsubmit="handleSaveAddress(event)">
          <div class="profile-modal-body">
            <div class="form-group" style="margin-bottom: 14px;">
              <label for="profile-addr-street">Street Address / Flat / Building <span class="required">*</span></label>
              <input type="text" id="profile-addr-street" value="${address.address || ''}" required>
            </div>
            <div class="form-group" style="margin-bottom: 14px;">
              <label for="profile-addr-city">City <span class="required">*</span></label>
              <input type="text" id="profile-addr-city" value="${address.city || ''}" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div class="form-group">
                <label for="profile-addr-state">State <span class="required">*</span></label>
                <input type="text" id="profile-addr-state" value="${address.state || ''}" required>
              </div>
              <div class="form-group">
                <label for="profile-addr-pin">PIN Code <span class="required">*</span></label>
                <input type="text" id="profile-addr-pin" value="${address.pinCode || ''}" required maxlength="6">
              </div>
            </div>
          </div>
          <div class="profile-modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeAllProfileModals()">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Address</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('profile-modals-container').innerHTML = modalHtml;
}

function handleSaveAddress(e) {
  e.preventDefault();
  const address = {
    address: document.getElementById('profile-addr-street').value.trim(),
    city: document.getElementById('profile-addr-city').value.trim(),
    state: document.getElementById('profile-addr-state').value.trim(),
    pinCode: document.getElementById('profile-addr-pin').value.trim()
  };
  localStorage.setItem('shopease_address', JSON.stringify(address));
  recordActivity('📍', `Delivery address updated (${address.city})`);
  closeAllProfileModals();
  showNotification('Delivery address saved! 📍', 'success');
}

/**
 * Clear User Cache & Cart
 */
function clearUserCache() {
  clearCart();
  localStorage.removeItem('shopease_activity');
  closeProfileDrawer();
  showNotification('Cache & Cart cleared successfully! ✨', 'success');
}

/**
 * Update the navbar Sign In / User Profile button
 */
function initAuth() {
  const authContainers = document.querySelectorAll('.nav-auth');
  const user = getCurrentUser();

  ensureProfilePanelElements();

  authContainers.forEach(container => {
    if (user && user.name) {
      const avatarSrc = user.avatar || DEFAULT_USER.avatar;
      container.innerHTML = `
        <button type="button" class="nav-profile-btn" id="nav-profile-btn" onclick="toggleProfileDrawer(event)" aria-label="Open Profile Menu" title="My Profile (${user.name})">
          <div class="nav-avatar-circle">
            <img src="${avatarSrc}" alt="${user.name}" class="nav-avatar-img" onerror="this.onerror=null; this.src='${DEFAULT_USER.avatar}';">
          </div>
          <span class="nav-user-name">${user.name}</span>
          <svg class="nav-profile-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
      `;
    } else {
      container.innerHTML = `
        <a href="login.html" class="nav-signin-btn" id="nav-signin-btn">
          <span>👤</span>
          <span>Sign In</span>
        </a>
      `;
    }
  });

  updateProfileDrawerContent();
}

// ============================================================
// NAVIGATION
// ============================================================

/**
 * Initialize the navbar: scroll effect, mobile toggle, active link
 */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Scroll effect — add shadow on scroll
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // Mobile menu toggle
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a.nav-item, .nav-signin-btn').forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });

    // Close mobile menu if clicked outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('open');
      }
    });
  }

  // Set active nav link based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a.nav-item').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Update cart count on load
  updateCartCount();
}

// ============================================================
// API HELPERS
// ============================================================

/**
 * Fetch all products from the API
 * @returns {Promise<Array>} Array of product objects
 */
async function fetchProducts() {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  const data = await response.json();
  return data.data;
}

/**
 * Fetch a single product by ID
 * @param {string} id - Product ID
 * @returns {Promise<Object>} Product object
 */
async function fetchProductById(id) {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) {
    throw new Error('Product not found');
  }
  const data = await response.json();
  return data.data;
}

/**
 * Submit an order to the API
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} Order response
 */
async function submitOrder(orderData) {
  const response = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to place order');
  }
  return data;
}

// ============================================================
// LOADING STATE
// ============================================================

/**
 * Show a loading indicator inside a container
 * @param {HTMLElement} container
 * @param {string} message
 */
function showLoading(container, message = 'Loading...') {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Show an error state inside a container
 * @param {HTMLElement} container
 * @param {string} message
 */
function showError(container, message = 'Something went wrong.') {
  container.innerHTML = `
    <div class="empty-state">
      <span class="empty-icon">😔</span>
      <h2>Oops!</h2>
      <p>${message}</p>
      <a href="index.html" class="btn btn-primary">Go Home</a>
    </div>
  `;
}

// ============================================================
// HOMEPAGE SHOWCASE INTERACTIVITY (Accordion & Showcase Cards)
// ============================================================

/**
 * Initialize Category Accordion and Showcase interactions
 */
function initShowcase() {
  // Category Accordion '+' buttons
  const catButtons = document.querySelectorAll('.sidebar-cat-btn');
  catButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = btn.closest('.sidebar-cat-item');
      if (parent) {
        // Toggle current item
        const isActive = parent.classList.contains('active');
        
        // Optional: close other open accordions for a clean feel
        // document.querySelectorAll('.sidebar-cat-item.active').forEach(item => {
        //   if (item !== parent) item.classList.remove('active');
        // });

        parent.classList.toggle('active', !isActive);
      }
    });
  });
}

/**
 * Handle quick add or view for mini showcase product card
 * @param {string} name
 * @param {string} category
 * @param {number} price
 * @param {string} image
 */
function handleShowcaseProduct(name, category, price, image) {
  // Generate deterministic ID
  const cleanId = 'showcase_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  addToCart({
    _id: cleanId,
    name: name,
    price: price,
    image: image,
    stock: 25,
    category: category
  }, 1);
}

/**
 * Handle Best Seller item click
 * @param {string} name
 * @param {number} price
 * @param {string} image
 */
function handleBestSellerClick(name, price, image) {
  const cleanId = 'bestseller_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  addToCart({
    _id: cleanId,
    name: name,
    price: price,
    image: image,
    stock: 30,
    category: 'Featured'
  }, 1);
}

// ============================================================
// DYNAMIC CATEGORY COUNTS ON HOMEPAGE
// ============================================================

function safeDecode(str) {
  if (!str) return '';
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (e) {
    return str.replace(/\+/g, ' ');
  }
}

function normalizeCategoryString(str) {
  if (!str) return '';
  return safeDecode(str)
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchCategoryShared(product, selectedCategory) {
  if (!selectedCategory || selectedCategory === 'all') return true;
  const normSelected = normalizeCategoryString(selectedCategory);
  const normProdCat = normalizeCategoryString(product.category || '');

  if (normProdCat === normSelected) return true;

  // DRESS & FROCK / DRESS & ROCK
  const isDressSelected = ['dress frock', 'dress and frock', 'dress rock', 'dress and rock', 'dress', 'frock'].some(a => normSelected === a || normSelected.includes(a));
  const isDressProduct = ['dress frock', 'dress and frock', 'dress rock', 'dress and rock'].some(a => normProdCat === a || normProdCat.includes(a));
  if (isDressSelected && isDressProduct) return true;

  // WINTER WEAR
  const isWinterSelected = ['winter wear', 'winter and wear', 'winter', 'winterwear'].some(a => normSelected === a || normSelected.includes(a));
  const isWinterProduct = ['winter wear', 'winter and wear', 'winter', 'winterwear'].some(a => normProdCat === a || normProdCat.includes(a));
  if (isWinterSelected && isWinterProduct) return true;

  // GLASSES & LENS
  const isGlassesSelected = ['glasses lens', 'glasses and lens', 'glasses', 'lens', 'sunglasses'].some(a => normSelected === a || normSelected.includes(a));
  const isGlassesProduct = ['glasses lens', 'glasses and lens'].some(a => normProdCat === a || normProdCat.includes(a));
  if (isGlassesSelected && isGlassesProduct) return true;

  // SHORTS & JEANS
  const isJeansSelected = ['shorts jeans', 'shorts and jeans', 'shorts', 'jeans', 'denim'].some(a => normSelected === a || normSelected.includes(a));
  const isJeansProduct = ['shorts jeans', 'shorts and jeans'].some(a => normProdCat === a || normProdCat.includes(a));
  if (isJeansSelected && isJeansProduct) return true;

  // Parent Category Fallbacks
  if (normSelected === 'fashion' && (normProdCat === 'fashion' || isDressProduct || isWinterProduct || isJeansProduct)) return true;
  if (normSelected === 'accessories' && (normProdCat === 'accessories' || isGlassesProduct)) return true;

  return normProdCat === normSelected || normProdCat.includes(normSelected);
}

function deduplicateProducts(products) {
  if (!Array.isArray(products)) return [];
  const seenIds = new Set();
  const seenNames = new Set();

  return products.filter(product => {
    if (!product) return false;
    const rawId = product._id || product.id || product.productId;
    if (rawId) {
      const idStr = rawId.toString();
      if (seenIds.has(idStr)) return false;
      seenIds.add(idStr);
    }
    const nameKey = (product.name || '').trim().toLowerCase();
    if (nameKey) {
      if (seenNames.has(nameKey)) return false;
      seenNames.add(nameKey);
    }
    return true;
  });
}

async function updateDynamicCategoryCounts() {
  const cards = document.querySelectorAll('.top-cat-card[data-category]');
  if (!cards.length) return;

  try {
    const rawProducts = await fetchProducts();
    if (!rawProducts || !rawProducts.length) return;
    const products = deduplicateProducts(rawProducts);

    cards.forEach(card => {
      const category = card.getAttribute('data-category');
      const countSpan = card.querySelector('.top-cat-count');
      if (category && countSpan) {
        const matchingCount = products.filter(p => matchCategoryShared(p, category)).length;
        countSpan.textContent = `(${matchingCount})`;
      }
    });
  } catch (err) {
    console.error('Error updating category counts:', err);
  }
}

// ============================================================
// INIT ON EVERY PAGE
// ============================================================
function initApp() {
  initTheme();
  initNavbar();
  initAuth();
  applyAppLanguage();
  applyAppCurrency();
  initShowcase();
  updateDynamicCategoryCounts();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}


