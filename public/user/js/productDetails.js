const thumbnails = document.querySelectorAll('.thumbnail');
function changeProductImage(imageUrl, thumbnail) {
  const mainImage = document.getElementById('mainProductImage');
  mainImage.src = imageUrl;
  thumbnails.forEach((item) => {
    item.classList.remove('active');
  });
  thumbnail.classList.add('active');
}
const mainProductImageContainer = document.querySelector('.main-product-image');
const mainProductImage = document.getElementById('mainProductImage');
let isImageZoomed = false;
mainProductImageContainer.addEventListener('click', function () {
  isImageZoomed = !isImageZoomed;
  this.classList.toggle('zoomed', isImageZoomed);
  if (!isImageZoomed) {
    mainProductImage.style.transform = 'scale(1)';
  }
});
mainProductImageContainer.addEventListener('mousemove', function (event) {
  if (!isImageZoomed) {
    return;
  }
  const rect = this.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const xPercent = mouseX / rect.width;
  const yPercent = mouseY / rect.height;
  const scale = 1.7;
  const moveX = (50 - xPercent * 100) * (scale - 1);
  const moveY = (50 - yPercent * 100) * (scale - 1);
  mainProductImage.style.transform = `translate(${moveX}%, ${moveY}%) scale(${scale})`;
});
let quantity = 1;
let selectedVariantId = null;
const availableStockText = document.getElementById('availableStockText');

let selectedVariantStock = Number(availableStockText?.dataset.stock || 0);
const variantOptions = document.querySelectorAll('.product-variant-option');
variantOptions.forEach((option) => {
  option.addEventListener('click', function () {
    variantOptions.forEach((item) => {
      item.classList.remove('selected');
    });
    this.classList.add('selected');
    selectedVariantId = this.dataset.variantId;
    selectedVariantStock = Number(this.dataset.stock);
    const selectedVariantPrice = Number(this.dataset.price);
    quantity = 1;
    if (quantityDisplay) {
      quantityDisplay.textContent = quantity;
    }
    const productPrice = document.getElementById('productPrice');
    const originalPrice = document.getElementById('originalPrice');
    const offerBadge = document.getElementById('productOfferBadge');

    const original = Number(this.dataset.originalPrice || this.dataset.price);
    const final = Number(this.dataset.finalPrice || this.dataset.price);
    const discount = Number(this.dataset.discountAmount || 0);
    const percentage = Number(this.dataset.discountPercentage || 0);

    if (productPrice) {
      productPrice.textContent = `₹${(discount > 0
        ? final
        : Number(this.dataset.price)
      ).toLocaleString('en-IN')}`;

      productPrice.classList.toggle('discounted', discount > 0);
    }

    if (originalPrice) {
      originalPrice.hidden = discount <= 0;
      originalPrice.textContent = discount > 0 ? `₹${original.toLocaleString('en-IN')}` : '';
    }

    if (offerBadge) {
      offerBadge.hidden = discount <= 0;
      offerBadge.textContent = discount > 0 ? `${percentage}% OFF` : '';
    }
    if (availableStockText) {
      if (selectedVariantStock > 0) {
        availableStockText.textContent = `${selectedVariantStock} available`;
        availableStockText.classList.remove('out-of-stock');
      } else {
        availableStockText.textContent = 'Out of stock';
        availableStockText.classList.add('out-of-stock');
      }
    }
    const variantInWishlist = this.dataset.wishlist === 'true';
    wishlistButton.classList.toggle('checked', variantInWishlist);
    wishlistIcon.textContent = variantInWishlist ? '♥' : '♡';

  });
});
const quantitySection = document.getElementById('quantitySection');
const quantityDisplay = document.getElementById('quantity');
const decreaseButton = document.getElementById('decreaseQuantity');
const increaseButton = document.getElementById('increaseQuantity');

if (variantOptions.length > 0) {
  const firstVariant = variantOptions[0];
  selectedVariantId = firstVariant.dataset.variantId;
  selectedVariantStock = Number(firstVariant.dataset.stock);
}
const Max_cart_Quantity = 5;

if (decreaseButton && increaseButton) {
  const thumbnails = document.querySelectorAll('.thumbnail');
  decreaseButton.addEventListener('click', function () {
    if (quantity > 1) {
      quantity--;
      quantityDisplay.textContent = quantity;
    }
  });
  increaseButton.addEventListener('click', function () {
    const maxQuantity = Math.min(selectedVariantStock, Max_cart_Quantity);
    if (quantity >= selectedVariantStock) {
      showToastMessage(`Only ${selectedVariantStock} quantity available`, 'error');
      return;
    }
    if (quantity < maxQuantity) {
      quantity++;
      quantityDisplay.textContent = quantity;
    } else {
      showToastMessage(`Maximum ${Max_cart_Quantity} quantity is allowed`, 'error');
    }
  });
}
//reviews and rating
let selectedRating = 0;
const reviewStars = document.querySelectorAll('.review-star-input button');
reviewStars.forEach((star) => {
  star.addEventListener('click', function () {
    selectedRating = Number(this.dataset.rating);
    reviewStars.forEach((item) => {
      const rating = Number(item.dataset.rating);
      item.classList.toggle('selected', rating <= selectedRating);
    });
  });
});
const submitReview = document.getElementById('submitReview');
if (submitReview) {
  submitReview.addEventListener('click', async function () {
    const comment = document.getElementById('reviewComment').value.trim();
    const message = document.getElementById('reviewMessage');
    const productId = submitReview.dataset.productId;
    try {
      const response = await fetch(`/product/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, comment: comment }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }
      message.textContent = result.message;
      message.className = 'success';
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.log('review erro ', error);
      message.textContent = error.message;
      message.className = 'error';
    }
  });
}
const relatedProducts = document.getElementById('relatedProducts');
const relatedPrevious = document.getElementById('relatedPrevious');
const relatedNext = document.getElementById('relatedNext');
if (relatedProducts) {
  relatedNext.addEventListener('click', function () {
    relatedProducts.scrollBy({
      left: 500,
      behavior: 'smooth',
    });
  });
  relatedPrevious.addEventListener('click', function () {
    relatedProducts.scrollBy({
      left: -500,
      behavior: 'smooth',
    });
  });
}
const cartCountElement = document.getElementById('cartCount');
const addCartBtn = document.getElementById('add-cart-button');
if (addCartBtn) {
  addCartBtn.addEventListener('click', async function () {
    const productId = this.dataset.productId;

    try {
      const response = await fetch('/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          productId: productId,
          variantId: selectedVariantId,
          quantity: quantity,
        }),
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
      if (cartCountElement) {
        cartCountElement.textContent = result.cartCount;
      }
      await removeProductIfExists(productId);
    } catch (error) {
      console.log('error ', error);
      showToastMessage(error.message, 'error');
    }
  });
}
const removeProductIfExists = async (productId) => {
  try {
    await fetch(`/account/wishlist/remove-if-exists/${productId}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    console.log(error);
  }
};
const wishlistButton = document.getElementById('wishlist-button');
const wishlistIcon = wishlistButton?.querySelector('.wishlist-icon');
if (wishlistButton) {
  wishlistButton.addEventListener('click', async function () {
    const productId = this.dataset.productId;
    try {
      const response = await fetch('/account/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ productId: productId, variantId: selectedVariantId }),
      });
      const result = await response.json();
      if (!response.ok) {
        showToastMessage(result.message, 'error');
        if (result.redirect) {
          setTimeout(() => {
            window.location.href = result.redirect;
          }, 1500);
        }
        return;
      }
      showToastMessage(result.message, 'success');
      wishlistButton.classList.add('checked');
      const wishlistIcon = wishlistButton.querySelector('.wishlist-icon');
      if (wishlistIcon) {
        wishlistIcon.textContent = '♥';
      }
    } catch (error) {
      console.log(error);
      showToastMessage(error.message, 'error');
    }
  });
}
