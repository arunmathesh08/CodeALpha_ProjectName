/* ============================================================
   ShopEase — product-details.js
   Product details page: fetch single product, quantity, add to cart
   ============================================================ */

let currentProduct = null;
let selectedQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
  loadProductDetails();
});

// ============================================================
// LOAD PRODUCT DETAILS
// ============================================================

async function loadProductDetails() {
  const container = document.getElementById('product-details-container');
  if (!container) return;

  // Get product ID or name/category/price from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const nameParam = urlParams.get('name');

  if (!productId && !nameParam) {
    showError(container, 'No product specified.');
    return;
  }

  showLoading(container, 'Loading product details…');

  try {
    if (productId && !productId.startsWith('showcase_') && !productId.startsWith('bestseller_') && productId.length === 24) {
      currentProduct = await fetchProductById(productId);
    } else {
      // Look up in API products or construct from query params
      try {
        const res = await fetch('/api/products');
        const json = await res.json();
        const products = json.success ? json.data : [];
        const cleanName = (nameParam || productId || '').toLowerCase();
        let match = products.find(p => p._id === productId || (p.name && cleanName && (p.name.toLowerCase().includes(cleanName) || cleanName.includes(p.name.toLowerCase()))));
        if (match) {
          currentProduct = match;
        }
      } catch (e) {
        console.warn('API fetch failed, fallback to param details:', e);
      }

      if (!currentProduct) {
        const name = nameParam || (productId ? productId.replace(/^(showcase|bestseller)_/, '').replace(/_/g, ' ') : 'Featured Product');
        const price = parseFloat(urlParams.get('price')) || 45.00;
        const category = urlParams.get('category') || 'Fashion';
        const image = urlParams.get('image') || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop';
        currentProduct = {
          _id: productId || ('showcase_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_')),
          name: name,
          price: price,
          category: category,
          image: image,
          description: urlParams.get('desc') || `High-quality ${category.toLowerCase()} crafted with premium materials for optimum style, durability, and comfort.`,
          rating: 4.8,
          stock: 25
        };
      }
    }
    renderProductDetails(currentProduct);
  } catch (error) {
    console.error('Error loading product:', error);
    showError(container, 'Product not found or server unavailable.');
  }
}

// ============================================================
// RENDER PRODUCT DETAILS
// ============================================================

function renderProductDetails(product) {
  const container = document.getElementById('product-details-container');
  if (!container) return;

  const stock = getStockStatus(product.stock);
  const isOutOfStock = product.stock === 0;
  const pricing = getProductPricing(product);

  container.innerHTML = `
    <a href="products.html" class="back-link">← Back to Products</a>
    <div class="product-details-content">
      <div class="product-image-section">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info-section">
        <span class="product-category">${product.category}</span>
        <h1 class="product-name">${product.name}</h1>
        <div class="product-rating">
          <span>${generateStars(product.rating)}</span>
          <span>${product.rating} / 5</span>
        </div>
        <div class="product-price-container">
          <span class="product-price">${formatPrice(pricing.sellingPrice)}</span>
          ${pricing.hasDiscount ? `
            <del class="product-original-price">${formatPrice(pricing.originalPrice)}</del>
            <span class="product-discount-badge">${pricing.discountPercent}% OFF</span>
          ` : ''}
        </div>
        <p class="product-description">${product.description}</p>
        <div class="product-stock ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
          ${isOutOfStock ? '⊘' : '✓'} ${stock.text}
        </div>

        ${!isOutOfStock ? `
          <div class="quantity-selector">
            <label>Quantity:</label>
            <div class="quantity-controls">
              <button id="qty-decrease" onclick="changeQuantity(-1)">−</button>
              <span class="qty-value" id="qty-value">${selectedQuantity}</span>
              <button id="qty-increase" onclick="changeQuantity(1)">+</button>
            </div>
          </div>
        ` : ''}

        <div class="product-detail-actions">
          <button class="btn btn-primary btn-lg btn-add-cart" id="add-to-cart-btn"
                  onclick="handleDetailAddToCart()"
                  ${isOutOfStock ? 'disabled' : ''}>
            <span class="cart-btn-icon">🛒</span> ${isOutOfStock ? (typeof t === 'function' ? t('out_of_stock') : 'Out of Stock') : (typeof t === 'function' ? t('add_to_cart') : 'Add to Cart')}
          </button>
          <button class="btn btn-accent btn-lg" id="buy-now-btn"
                  onclick="handleBuyNow()"
                  ${isOutOfStock ? 'disabled' : ''}>
            ${isOutOfStock ? 'Unavailable' : '⚡ Buy Now'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// QUANTITY CONTROLS
// ============================================================

function changeQuantity(delta) {
  if (!currentProduct) return;

  const newQty = selectedQuantity + delta;

  if (newQty < 1) return;
  if (newQty > currentProduct.stock) {
    showNotification(`Only ${currentProduct.stock} available in stock.`, 'warning');
    return;
  }

  selectedQuantity = newQty;
  document.getElementById('qty-value').textContent = selectedQuantity;
}

// ============================================================
// ADD TO CART FROM DETAILS PAGE
// ============================================================

function handleDetailAddToCart() {
  if (!currentProduct) return;
  addToCart(currentProduct, selectedQuantity);
}

// ============================================================
// BUY NOW — Add to cart and go to checkout
// ============================================================

function handleBuyNow() {
  if (!currentProduct) return;

  // Add to cart, then navigate to checkout
  const success = addToCart(currentProduct, selectedQuantity);
  if (success) {
    window.location.href = 'checkout.html';
  }
}
