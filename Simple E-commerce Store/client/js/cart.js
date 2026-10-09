/* ============================================================
   ShopEase — cart.js
   Cart page: render items, quantity controls, totals, checkout
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

// ============================================================
// RENDER CART
// ============================================================

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  const cartSummaryContainer = document.getElementById('cart-summary');
  const cartContent = document.getElementById('cart-content');
  const cartEmpty = document.getElementById('cart-empty');

  const cart = getCart();

  if (cart.length === 0) {
    // Show empty state
    if (cartContent) cartContent.style.display = 'none';
    if (cartEmpty) cartEmpty.style.display = 'block';
    return;
  }

  // Show cart content
  if (cartContent) cartContent.style.display = 'block';
  if (cartEmpty) cartEmpty.style.display = 'none';

  // Render cart items
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item" id="cart-item-${item.productId}">
        <div class="cart-item-image">
          <img src="${item.image}" alt="${item.name}">
        </div>
        <div class="cart-item-details">
          <h4 class="cart-item-name">${item.name}</h4>
          <p class="cart-item-price">${formatPrice(item.price)} each</p>
          <div class="cart-item-quantity">
            <button onclick="handleCartQuantity('${item.productId}', -1)">−</button>
            <span>${item.quantity}</span>
            <button onclick="handleCartQuantity('${item.productId}', 1)">+</button>
          </div>
        </div>
        <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
        <button class="cart-item-remove" onclick="handleRemoveItem('${item.productId}')" title="Remove item">✕</button>
      </div>
    `).join('');
  }

  // Render cart summary
  renderCartSummary();
}

// ============================================================
// RENDER CART SUMMARY
// ============================================================

function renderCartSummary() {
  const summaryContainer = document.getElementById('cart-summary');
  if (!summaryContainer) return;

  const { subtotal, deliveryCharge, total } = calculateCartTotals();
  const cart = getCart();

  summaryContainer.innerHTML = `
    <h3>Order Summary</h3>
    <div class="summary-row">
      <span>Items (${cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>Delivery</span>
      <span>${deliveryCharge === 0 ? '<span class="free-delivery">FREE</span>' : formatPrice(deliveryCharge)}</span>
    </div>
    ${subtotal > 0 && subtotal < 999 ? `
      <div class="summary-row" style="color: var(--success); font-size: 0.75rem;">
        <span>Add ${formatPrice(999 - subtotal)} more for free delivery</span>
        <span></span>
      </div>
    ` : ''}
    <div class="summary-row total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
    <a href="checkout.html" class="btn btn-primary btn-lg">Proceed to Checkout</a>
  `;
}

// ============================================================
// QUANTITY & REMOVE HANDLERS
// ============================================================

function handleCartQuantity(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);

  if (!item) return;

  const newQty = item.quantity + delta;

  if (newQty < 1) {
    handleRemoveItem(productId);
    return;
  }

  if (newQty > item.stock) {
    showNotification(`Only ${item.stock} available in stock.`, 'warning');
    return;
  }

  updateCartQuantity(productId, newQty);
  renderCart();
}

function handleRemoveItem(productId) {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  removeFromCart(productId);
  if (item) {
    showNotification(`${item.name} removed from cart.`, 'success');
  }
  renderCart();
}
