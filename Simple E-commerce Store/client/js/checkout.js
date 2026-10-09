/* ============================================================
   ShopEase — checkout.js
   Checkout page: order summary, form validation, demo payment,
   order submission via API
   ============================================================ */

let isSubmitting = false;

document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  setupCheckoutForm();
  setupPaymentToggle();
});

// ============================================================
// RENDER ORDER SUMMARY (SIDEBAR)
// ============================================================

function renderCheckoutSummary() {
  const summaryContainer = document.getElementById('checkout-summary');
  if (!summaryContainer) return;

  const cart = getCart();
  const { subtotal, deliveryCharge, total } = calculateCartTotals();

  if (cart.length === 0) {
    // Redirect to cart if empty
    window.location.href = 'cart.html';
    return;
  }

  const itemsHtml = cart.map(item => `
    <div class="order-summary-item">
      <span class="item-name">${item.name}</span>
      <span class="item-qty">×${item.quantity}</span>
      <span class="item-total">${formatPrice(item.price * item.quantity)}</span>
    </div>
  `).join('');

  summaryContainer.innerHTML = `
    <h3>Order Summary</h3>
    <div class="order-items-list">
      ${itemsHtml}
    </div>
    <div class="summary-row">
      <span>Subtotal</span>
      <span>${formatPrice(subtotal)}</span>
    </div>
    <div class="summary-row">
      <span>Delivery</span>
      <span>${deliveryCharge === 0 ? '<span class="free-delivery">FREE</span>' : formatPrice(deliveryCharge)}</span>
    </div>
    <div class="summary-row total">
      <span>Total</span>
      <span>${formatPrice(total)}</span>
    </div>
  `;
}

// ============================================================
// PAYMENT TOGGLE (COD vs Demo Card)
// ============================================================

function setupPaymentToggle() {
  const paymentOptions = document.querySelectorAll('input[name="payment"]');
  const cardFields = document.getElementById('card-fields');

  paymentOptions.forEach(option => {
    option.addEventListener('change', (e) => {
      // Update selected styling
      document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      e.target.closest('.payment-option').classList.add('selected');

      // Toggle card fields
      if (cardFields) {
        cardFields.style.display = e.target.value === 'Demo Card Payment' ? 'block' : 'none';
      }
    });
  });
}

// ============================================================
// FORM VALIDATION
// ============================================================

function validateForm() {
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

  // Name
  const name = document.getElementById('customer-name');
  if (!name.value.trim()) {
    setFieldError(name, 'Full name is required');
    isValid = false;
  }

  // Email
  const email = document.getElementById('customer-email');
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!email.value.trim()) {
    setFieldError(email, 'Email is required');
    isValid = false;
  } else if (!emailRegex.test(email.value.trim())) {
    setFieldError(email, 'Enter a valid email address');
    isValid = false;
  }

  // Phone
  const phone = document.getElementById('customer-phone');
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phone.value.trim()) {
    setFieldError(phone, 'Phone number is required');
    isValid = false;
  } else if (!phoneRegex.test(phone.value.trim())) {
    setFieldError(phone, 'Enter a valid 10-digit Indian phone number');
    isValid = false;
  }

  // Address
  const address = document.getElementById('customer-address');
  if (!address.value.trim()) {
    setFieldError(address, 'Address is required');
    isValid = false;
  }

  // City
  const city = document.getElementById('customer-city');
  if (!city.value.trim()) {
    setFieldError(city, 'City is required');
    isValid = false;
  }

  // State
  const state = document.getElementById('customer-state');
  if (!state.value.trim()) {
    setFieldError(state, 'State is required');
    isValid = false;
  }

  // PIN Code
  const pinCode = document.getElementById('customer-pincode');
  const pinRegex = /^\d{6}$/;
  if (!pinCode.value.trim()) {
    setFieldError(pinCode, 'PIN code is required');
    isValid = false;
  } else if (!pinRegex.test(pinCode.value.trim())) {
    setFieldError(pinCode, 'Enter a valid 6-digit PIN code');
    isValid = false;
  }

  // Payment method
  const payment = document.querySelector('input[name="payment"]:checked');
  if (!payment) {
    showNotification('Please select a payment method', 'error');
    isValid = false;
  }

  return isValid;
}

function setFieldError(input, message) {
  input.classList.add('error');
  const errorEl = input.parentElement.querySelector('.error-message');
  if (errorEl) {
    errorEl.textContent = message;
  }
}

// ============================================================
// SETUP CHECKOUT FORM SUBMISSION
// ============================================================

function setupCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting) return;

    // Validate
    if (!validateForm()) return;

    const cart = getCart();
    if (cart.length === 0) {
      showNotification('Your cart is empty!', 'error');
      return;
    }

    // Collect form data
    const orderData = {
      customerName: document.getElementById('customer-name').value.trim(),
      email: document.getElementById('customer-email').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      address: document.getElementById('customer-address').value.trim(),
      city: document.getElementById('customer-city').value.trim(),
      state: document.getElementById('customer-state').value.trim(),
      pinCode: document.getElementById('customer-pincode').value.trim(),
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      paymentMethod: document.querySelector('input[name="payment"]:checked').value
    };

    // Submit order
    const submitBtn = document.getElementById('place-order-btn');
    isSubmitting = true;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Placing Order…';

      const response = await submitOrder(orderData);

      // Success — store order data for the success page
      sessionStorage.setItem('shopease_last_order', JSON.stringify(response.data));

      // Record in profile orders history
      try {
        const orderHistory = getStoredOrders();
        orderHistory.unshift({
          orderId: response.data.orderId || ('SE-' + Math.floor(10000 + Math.random() * 90000)),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'Confirmed',
          statusClass: 'transit',
          statusIcon: '📦',
          total: response.data.totalAmount || total,
          paymentMethod: orderData.paymentMethod,
          items: cart.map(i => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image
          }))
        });
        localStorage.setItem('shopease_orders', JSON.stringify(orderHistory));
        recordActivity('🛍️', `Placed order #${response.data.orderId || 'NEW'}`);
      } catch (e) {
        console.error('Error recording order history:', e);
      }

      // Clear the cart
      clearCart();

      // Redirect to success page
      window.location.href = 'order-success.html';
    } catch (error) {
      console.error('Order error:', error);
      showNotification(error.message || 'Failed to place order. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = '🛍️ Place Order';
      isSubmitting = false;
    }
  });
}
