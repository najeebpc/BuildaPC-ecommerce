const applyFilterBtn = document.querySelector('.apply-filter-btn');
applyFilterBtn.addEventListener('click', function () {
  const selectedCategories = document.querySelectorAll('input[name="category"]:checked');
  const minPrice = document.getElementById('minPrice').value;
  const maxPrice = document.getElementById('maxPrice').value;

  const params = new URLSearchParams();
  selectedCategories.forEach((category) => {
    params.append('category', category.value);
  });
  if (minPrice) {
    params.set('minPrice', minPrice);
  }
  if (maxPrice) {
    params.set('maxPrice', maxPrice);
  }
  window.location.href = `/products?${params.toString()}`;
});

const sortProduct = document.getElementById('sortProducts');
sortProduct.addEventListener('change', function () {
  const params = new URLSearchParams(window.location.search);
  params.set('sort', this.value);
  window.location.href = `/products?${params.toString()}`;
});
const cartCountElement = document.getElementById('cartCount');
document.querySelectorAll('.add-cart-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const productId = this.dataset.productId;
    const hasVariants = this.dataset.hasVariants === 'true';
    if (hasVariants) {
      showToastMessage('Please select a option from the product page', 'warning');
      setTimeout(() => {
        window.location.href = `/product/${productId}`;
      }, 1000);
      return;
    }
    try {
      const response = await fetch('/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ productId: productId, variantId: null, quantity: 1 }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
        if (result.redirect) {
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 1000);
        }
        return;
      }
      showToastMessage(result.message, 'success');
      if (cartCountElement) {
        cartCountElement.textContent = result.cartCount;
      }
      await removeProductFromWishlist(productId);
    } catch (error) {
      console.log('add to cart error', error);
      showToastMessage(error.message, 'error');
    }
  });
});
const removeProductFromWishlist = async (productId) => {
  try {
    const response = await fetch(`/account/wishlist/remove-if-exists/${productId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    const result = await response.json();
    console.log('wishlist removal response', result);
    if (!response.ok || !result.success) {
      console.log('wishlist removal failed', result.message);
      return;
    }
    if (result.removed) {
      console.log('product removed from wishlist');
    } else {
      console.log('product was not removed from wishlist');
    }
  } catch (error) {
    console.log('wishlist cleanup error', error);
  }
};
document.querySelectorAll('.wishlist-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const productId = this.dataset.productId;
    const hasVariants = this.dataset.hasVariants === 'true';
    if (hasVariants) {
      showToastMessage('Please select a variant from the product page', 'warning');
      setTimeout(() => {
        window.location.href = `/product/${productId}`;
      }, 1000);
      return;
    }
    try {
      const response = await fetch('/account/wishlist', {
        method: 'POST',
        headers: { 'Content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ productId: productId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message || 'Failed to add product to wishlist', 'error');
        if (result.redirect) {
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 1500);
        }
        return;
      }

      showToastMessage(result.message, 'success');
      this.classList.add('checked');
      const icon = this.querySelector('.wishlist-icon');
      if (icon) {
        icon.textContent = '♥';
      }
    } catch (error) {
      console.log('Add to wishlist error', error);
      showToastMessage(error.message, 'error');
    }
  });
});
