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
  window.location.href = `/products/preBuilt?${params.toString()}`;
});

const sortProduct = document.getElementById('sortProducts');
sortProduct.addEventListener('change', function () {
  const params = new URLSearchParams(window.location.search);
  params.set('sort', this.value);
  window.location.href = `/products/preBuilt?${params.toString()}`;
});
document.querySelectorAll('.add-cart-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const productId = this.dataset.productId;
    try {
      const response = await fetch('/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ productId: productId, quantity: 1 }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
        if (result.redirect) {
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 1500);
        }
        return;
      }
      showToastMessage(result.message, 'success');
      await removeProductFromWishlist(productId);
    } catch (error) {
      showToastMessage(error.message, 'error');
    }
  });
});
const removeProductFromWishlist = async (productId) => {
  try {
    await fetch(`/account/wishlist/remove-if-exists/${productId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    console.log('wishlist delete error', error);
  }
};
document.querySelectorAll('.wishlist-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    const productId = this.dataset.productId;
    try {
      const response = await fetch('/account/wishlist', {
        method: 'POST',
        headers: { 'Content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ productId: productId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message, 'error');
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
      showToastMessage(error.message, 'error');
    }
  });
});
