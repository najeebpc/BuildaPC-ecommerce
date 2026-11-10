document.querySelectorAll('.cart-remove-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const cartItem = this.closest('.cart-item');
    const cartItemId = cartItem.dataset.id;
    try {
      const response = await fetch(`/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();
      if (!response.ok) {
        showToastMessage(result.message, 'error');
        return;
      }
      showToastMessage(result.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToastMessage(error.message, 'error');
    }
  });
});
document.querySelectorAll('.cart-wishlist-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const cartItem = this.closest('.cart-item');
    const cartItemId = cartItem.dataset.id;
    const productId = cartItem.dataset.productId;
    try {
      const response = await fetch('/account/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ productId: productId, fromCart: true }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
        return;
      }
      const cartResponse = await fetch(`/cart/${cartItemId}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const cartResult = await cartResponse.json();
      if (!cartResponse) {
        return;
      }
      showToastMessage(result.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      showToastMessage(error.message, 'error');
    }
  });
});
function showToastMessage(message, type) {
  const toast = document.getElementById('toastMessage');
  const text = document.getElementById('toastMessageText');
  console.log('MESSAGE:', message);
  console.log('TYPE:', type);
  text.textContent = message;
  toast.classList.remove('success', 'error', 'show');
  toast.classList.add(type);
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.remove('success');
    toast.classList.remove('error');
  }, 4000);
}
const Max_Cart_Quantity = 5;
const cartItems = document.querySelectorAll('.cart-item');

cartItems.forEach((cartItem) => {
  const decreaseButton = cartItem.querySelector('.quantity-minus');
  const increaseButton = cartItem.querySelector('.quantity-plus');
  const quantityDisplay = cartItem.querySelector('.quantity-value');
  const stock = Number(cartItem.dataset.stock);
  const cartItemId = cartItem.dataset.id;

  if (!decreaseButton || !increaseButton || !quantityDisplay) {
    return;
  }
  decreaseButton.addEventListener('click', async function () {

    let quantity = Number(quantityDisplay.textContent);
    if (quantity <= 1) {
      return;
    }
    const newQuantity = quantity - 1;
    try {
      const response = await fetch(`/cart/${cartItemId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
        return;
      }
      quantityDisplay.textContent = newQuantity;
      updateCartTotal();
      updateCartItemCount();
    } catch (error) {

      showToastMessage('failed to updated quantity', 'error');
    }
  });
  increaseButton.addEventListener('click', async function () {
    let quantity = Number(quantityDisplay.textContent);
    const maxQuantity = Math.min(stock, Max_Cart_Quantity);
    const newQuantity = quantity + 1;
    if (quantity >= stock) {
      showToastMessage(`Only ${stock} item${stock > 1 ? 's' : ''} available`, 'warning');
      return;
    }
    if (quantity >= Max_Cart_Quantity) {
      showToastMessage(`Maximum ${Max_Cart_Quantity} quanity allowed`, 'error');
      return;
    }
    try {
      const response = await fetch(`/cart/${cartItemId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
        return;
      }
      quantityDisplay.textContent = newQuantity;
      updateCartTotal();
      updateCartItemCount();
    } catch (error) {
      console.log('increase error ', error);
      showToastMessage('Failed to update quantity', 'error');
    }
  });
});
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');

function updateCartTotal() {
  let subtotal = 0;
  let totalSavings = 0;

  document.querySelectorAll('.cart-item').forEach((cartItem) => {
    const price = Number(cartItem.dataset.price) || 0;
    const originalPrice = Number(cartItem.dataset.originalPrice) || price;
    const quantityDisplay = cartItem.querySelector('.quantity-value');

    if (!quantityDisplay) return;

    const quantity = Number(quantityDisplay.textContent) || 0;
    const lineTotal = price * quantity;

    subtotal += lineTotal;
    totalSavings += Math.max(0, originalPrice - price) * quantity;

    const lineTotalElement = cartItem.querySelector('.cart-line-total');

    if (lineTotalElement) {
      lineTotalElement.textContent = `Item total: ₹${lineTotal.toLocaleString('en-IN')}`;
    }
  });

  if (cartSubtotal) {
    cartSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  }

  if (cartTotal) {
    cartTotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  }

  const savingsElement = document.getElementById('cartSavings');

  if (savingsElement) {
    savingsElement.textContent = `You save ₹${totalSavings.toLocaleString('en-IN')}`;
    savingsElement.hidden = totalSavings <= 0;
  }
}
updateCartTotal();
function updateCartItemCount() {
  let totalQuantity = 0;
  document.querySelectorAll('.cart-item').forEach((cartItem) => {
    const quantity = Number(cartItem.querySelector('.quantity-value').textContent);
    totalQuantity += quantity;
    const cartItemCount = document.getElementById('cartItemCount');
    if (cartItemCount) {
      cartItemCount.textContent = `(${totalQuantity} items)`;
    }
  });
}
updateCartItemCount();
const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
if (proceedToCheckoutBtn) {
  proceedToCheckoutBtn.addEventListener('click', async function () {
    try {
      const response = await fetch('/checkout/validate', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
        return;
      }
      window.location.href = '/checkout';
    } catch (error) {
      showToastMessage('Unable to proceed to checkout', 'error');
    }
  });
}
