const addToCart = async (productId, variantId = nll) => {
  try {
    const response = await fetch('/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: productId,
        variantId: variantId || null,
        quantity: 1,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      showToastMessage(result.message, 'error');
      return;
    }
    showToastMessage(result.message, 'success');
    setTimeout(() => {
      removeFromWishlist(productId, variantId, false);
    }, 1000);
  } catch (error) {
    showToastMessage(error.message, 'error');
  }
};
const removeFromWishlist = async (productId, variantId = null, showSuccess = true) => {
  try {
    const response = await fetch(`/account/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId: variantId || null }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove product');
    }
    if (showSuccess) {
      showToastMessage(result.message, 'success');
    }

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    showToastMessage(error.message, 'error');
  }
};
