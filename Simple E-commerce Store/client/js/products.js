/* ============================================================
   ShopEase — products.js
   Products page: fetch, render, search, filter, sort
   ============================================================ */

let allProducts = [];        // All products from API
let filteredProducts = [];   // Products after search/filter/sort

function initProductsPage() {
  loadProducts();
  setupFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProductsPage);
} else {
  initProductsPage();
}

// ============================================================
// DEDUPLICATION & IDENTIFIER UTILITIES
// ============================================================

/**
 * Deduplicate product array based on unique identifier (_id, id, productId) or unique product key
 * @param {Array} products
 * @returns {Array} Unique products
 */
function deduplicateProducts(products) {
  if (!Array.isArray(products)) return [];
  const seenIds = new Set();
  const seenNames = new Set();
  const seenImages = new Set();

  return products.filter(product => {
    if (!product) return false;

    // 1. Check unique ID
    const rawId = product._id || product.id || product.productId || product.sku;
    if (rawId) {
      const idStr = rawId.toString();
      if (seenIds.has(idStr)) {
        return false;
      }
      seenIds.add(idStr);
    }

    // 2. Check unique name
    const nameKey = (product.name || '').trim().toLowerCase();
    if (nameKey) {
      if (seenNames.has(nameKey)) {
        return false;
      }
      seenNames.add(nameKey);
    }

    // 3. Check unique image URL (preventing reused product images)
    if (product.image) {
      const baseImage = product.image.split('?')[0].trim().toLowerCase();
      if (baseImage && seenImages.has(baseImage)) {
        return false;
      }
      seenImages.add(baseImage);
    }

    return true;
  });
}

// ============================================================
// STRING NORMALIZATION & CATEGORY MATCHING
// ============================================================

function safeDecode(str) {
  if (!str) return '';
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (e) {
    return str.replace(/\+/g, ' ');
  }
}

/**
 * Normalize string for safe comparison (removes symbols, extra spaces, lowercase)
 * @param {string} str
 * @returns {string}
 */
function normalizeString(str) {
  if (!str) return '';
  return safeDecode(str)
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a product matches a selected category filter
 * @param {Object} product
 * @param {string} selectedCategory
 * @returns {boolean}
 */
function matchCategory(product, selectedCategory) {
  if (!selectedCategory || selectedCategory === 'all') return true;

  const normSelected = normalizeString(selectedCategory);
  const normProdCat = normalizeString(product.category || '');

  // Exact normalized category match
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

// ============================================================
// LOAD PRODUCTS FROM API
// ============================================================

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  showLoading(grid, 'Loading products…');

  try {
    const rawProducts = await fetchProducts();
    // Deduplicate on initial load
    allProducts = deduplicateProducts(rawProducts);
    filteredProducts = [...allProducts];

    // Read URL query parameters and session storage
    const urlParams = new URLSearchParams(window.location.search);
    const urlCategory = urlParams.get('category');
    const urlSearch = urlParams.get('search');
    const savedCategory = sessionStorage.getItem('filter_category');

    const targetCategory = urlCategory || savedCategory;
    if (savedCategory) {
      sessionStorage.removeItem('filter_category');
    }

    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');

    if (targetCategory && categoryFilter) {
      const targetNorm = normalizeString(targetCategory);
      let matchedIndex = -1;

      for (let i = 0; i < categoryFilter.options.length; i++) {
        const optVal = categoryFilter.options[i].value;
        const optText = categoryFilter.options[i].textContent;
        const optNorm = normalizeString(optVal);
        const optTextNorm = normalizeString(optText);

        if (optNorm === targetNorm || optTextNorm === targetNorm) {
          matchedIndex = i;
          break;
        }
      }

      if (matchedIndex !== -1) {
        categoryFilter.selectedIndex = matchedIndex;
      } else if (targetCategory.toLowerCase() !== 'all') {
        const cleanName = decodeURIComponent(targetCategory).trim();
        const newOption = document.createElement('option');
        newOption.value = cleanName;
        newOption.textContent = cleanName;
        newOption.selected = true;
        categoryFilter.appendChild(newOption);
        categoryFilter.value = cleanName;
      }
    }

    if (urlSearch && searchInput) {
      searchInput.value = decodeURIComponent(urlSearch).trim();
    }

    applyFilters();
  } catch (error) {
    console.error('Error loading products:', error);
    showError(grid, 'Failed to load products. Please check if the server is running.');
  }
}

// ============================================================
// RENDER PRODUCTS GRID (DEDUPLICATED)
// ============================================================

function renderProducts(products) {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Always ensure strictly unique products before rendering
  const uniqueList = deduplicateProducts(products);

  if (uniqueList.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <span class="no-results-icon">🔍</span>
        <h3>No products found</h3>
        <p>Try adjusting your search or filter criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = uniqueList.map(product => {
    const stock = getStockStatus(product.stock);
    const escapedName = (product.name || '').replace(/'/g, "\\'");
    const pricing = getProductPricing(product);

    return `
      <div class="product-card" id="product-${product._id}">
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
            <a href="product-details.html?id=${product._id}" class="btn btn-secondary btn-sm btn-view-details">${typeof t === 'function' ? t('view_details') : 'View Details'}</a>
            <button class="btn btn-primary btn-sm btn-add-cart" onclick="handleAddToCart('${product._id}')"
                    ${product.stock === 0 ? 'disabled' : ''}>
              <span class="cart-btn-icon">🛒</span> ${product.stock === 0 ? (typeof t === 'function' ? t('out_of_stock') : 'Out of Stock') : (typeof t === 'function' ? t('add_to_cart') : 'Add to Cart')}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// HANDLE ADD TO CART FROM PRODUCTS PAGE
// ============================================================

function handleAddToCart(productId) {
  const product = allProducts.find(p => p._id === productId);
  if (product) {
    addToCart(product, 1);
  }
}

// ============================================================
// SEARCH, FILTER, SORT (DEDUPLICATED)
// ============================================================

function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilters);
  }
  if (sortFilter) {
    sortFilter.addEventListener('change', applyFilters);
  }
}

function applyFilters() {
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const sortFilter = document.getElementById('sort-filter');

  const rawSearch = searchInput ? searchInput.value : '';
  const searchTerm = rawSearch.toLowerCase().trim();
  const category = categoryFilter ? categoryFilter.value : 'all';
  const sortBy = sortFilter ? sortFilter.value : 'default';

  // Ensure unique source products
  const uniqueSource = deduplicateProducts(allProducts);

  // Filter by category and search term
  filteredProducts = uniqueSource.filter(product => {
    const matchesCategory = matchCategory(product, category);

    const matchesSearch = !searchTerm ||
      (product.name && product.name.toLowerCase().includes(searchTerm)) ||
      (product.category && product.category.toLowerCase().includes(searchTerm)) ||
      (product.description && product.description.toLowerCase().includes(searchTerm));

    return matchesCategory && matchesSearch;
  });

  // Extra deduplication safeguard
  filteredProducts = deduplicateProducts(filteredProducts);

  // Sort
  if (sortBy === 'price-low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  renderProducts(filteredProducts);
  updateResultsInfo(filteredProducts.length);
}

function updateResultsInfo(count) {
  const resultsInfo = document.getElementById('results-info');
  if (resultsInfo) {
    resultsInfo.textContent = `Showing ${count} product${count !== 1 ? 's' : ''}`;
  }
}
