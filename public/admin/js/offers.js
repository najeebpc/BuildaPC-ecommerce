document.addEventListener('DOMContentLoaded', () => {
  const offerModal = document.getElementById('offerModal');
  const deleteOfferModal = document.getElementById('deleteOfferModal');
  const offerForm = document.getElementById('offerForm');

  const offerIdInput = document.getElementById('offerId');
  const offerTypeInput = document.getElementById('offerType');
  const productIdInput = document.getElementById('productId');
  const categoryIdInput = document.getElementById('categoryId');
  const discountInput = document.getElementById('discountPercentage');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  const productTargetGroup = document.getElementById('productTargetGroup');
  const categoryTargetGroup = document.getElementById('categoryTargetGroup');

  const offerModalTitle = document.getElementById('offerModalTitle');
  const saveOfferBtn = document.getElementById('saveOfferBtn');
  const cancelOfferBtn = document.getElementById('cancelOfferBtn');
  const offerFormError = document.getElementById('offerFormError');
  const confirmDeleteOfferBtn = document.getElementById('confirmDeleteOfferBtn');

  let selectedDeleteOfferId = null;
  let isSaving = false;
  let isDeleting = false;

  function formatDateTimeLocal(dateValue) {
    if (!dateValue) return '';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return '';

    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function showFormError(message) {
    offerFormError.textContent = message;
    offerFormError.hidden = false;
  }

  function clearFormError() {
    offerFormError.textContent = '';
    offerFormError.hidden = true;
  }

  function updateOfferTarget() {
    const type = offerTypeInput.value;

    const isProductOffer = type === 'product';
    const isCategoryOffer = type === 'category';

    productTargetGroup.classList.toggle('visible', isProductOffer);
    categoryTargetGroup.classList.toggle('visible', isCategoryOffer);

    productIdInput.required = isProductOffer;
    categoryIdInput.required = isCategoryOffer;

    if (!isProductOffer) {
      productIdInput.value = '';
    }

    if (!isCategoryOffer) {
      categoryIdInput.value = '';
    }
  }

  window.openAddOfferModal = function () {
    offerForm.reset();

    offerIdInput.value = '';
    offerModalTitle.textContent = 'Add Offer';
    saveOfferBtn.textContent = 'Save Offer';

    clearFormError();
    updateOfferTarget();

    offerModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  window.closeOfferModal = function () {
    if (isSaving) return;

    offerModal.classList.remove('show');
    document.body.style.overflow = '';
    clearFormError();
  };

  window.openEditOfferModal = function (button) {
    clearFormError();

    offerForm.reset();

    const offer = button.dataset;

    offerIdInput.value = offer.id;
    offerTypeInput.value = offer.type;
    discountInput.value = offer.discount;

    productIdInput.value = offer.product;
    categoryIdInput.value = offer.category;

    startDateInput.value = formatDateTimeLocal(offer.start);
    endDateInput.value = formatDateTimeLocal(offer.end);

    offerModalTitle.textContent = 'Edit Offer';
    saveOfferBtn.textContent = 'Save Changes';

    updateOfferTarget();

    offerModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  function validateOfferForm() {
    const offerType = offerTypeInput.value;
    const discount = Number(discountInput.value);
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (!['product', 'category'].includes(offerType)) {
      return 'Please select a valid offer type.';
    }

    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
      return 'Discount percentage must be greater than 0 and at most 100.';
    }

    if (offerType === 'product' && !productIdInput.value) {
      return 'Please select a product.';
    }

    if (offerType === 'category' && !categoryIdInput.value) {
      return 'Please select a category.';
    }

    if (!startDateInput.value || !endDateInput.value) {
      return 'Please select both start and end dates.';
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return 'Please provide valid dates.';
    }

    if (endDate <= startDate) {
      return 'The end date must be later than the start date.';
    }

    return null;
  }

  offerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isSaving) return;

    clearFormError();

    const validationError = validateOfferForm();

    if (validationError) {
      showFormError(validationError);
      return;
    }

    const offerId = offerIdInput.value.trim();
    const isEditing = Boolean(offerId);

    const payload = {
      offerType: offerTypeInput.value,
      discountPercentage: Number(discountInput.value),
      startDate: new Date(startDateInput.value).toISOString(),
      endDate: new Date(endDateInput.value).toISOString(),
      productId: offerTypeInput.value === 'product' ? productIdInput.value : null,
      categoryId: offerTypeInput.value === 'category' ? categoryIdInput.value : null,
    };

    isSaving = true;
    saveOfferBtn.disabled = true;
    cancelOfferBtn.disabled = true;
    saveOfferBtn.textContent = isEditing ? 'Saving...' : 'Creating...';

    try {
      const response = await fetch(
        isEditing ? `/admin/offers/${encodeURIComponent(offerId)}` : '/admin/offers',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to save offer.');
      }
      showToastMessage(result.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } catch (error) {
      console.log('add offer error', error);
      showToastMessage(error.message, 'error');
    } finally {
      isSaving = false;
      saveOfferBtn.disabled = false;
      cancelOfferBtn.disabled = false;
      saveOfferBtn.textContent = isEditing ? 'Save Changes' : 'Save Offer';
    }
  });

  window.toggleOfferStatus = async function (offerId, isActive) {
    const checkbox = document.querySelector(`.offer-switch input[onchange*="${offerId}"]`);

    if (checkbox) checkbox.disabled = true;

    try {
      const response = await fetch(`/admin/offers/${encodeURIComponent(offerId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ isActive }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update offer status.');
      }
      showToastMessage(result.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } catch (error) {
      if (checkbox) checkbox.checked = !isActive;
      showToastMessage(error.message, 'error');
    } finally {
      if (checkbox) checkbox.disabled = false;
    }
  };

  window.openDeleteOfferModal = function (offerId) {
    selectedDeleteOfferId = offerId;

    deleteOfferModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  window.closeDeleteOfferModal = function () {
    if (isDeleting) return;

    deleteOfferModal.classList.remove('show');
    selectedDeleteOfferId = null;
    document.body.style.overflow = '';
  };

  window.confirmDeleteOffer = async function () {
    if (!selectedDeleteOfferId || isDeleting) return;

    isDeleting = true;
    confirmDeleteOfferBtn.disabled = true;
    confirmDeleteOfferBtn.textContent = 'Deleting...';

    try {
      const response = await fetch(`/admin/offers/${encodeURIComponent(selectedDeleteOfferId)}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to delete offer.');
      }
      showToastMessage(result.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } catch (error) {
      showToastMessage(error.message, 'error');
    } finally {
      isDeleting = false;
      confirmDeleteOfferBtn.disabled = false;
      confirmDeleteOfferBtn.textContent = 'Delete Offer';
    }
  };

  offerTypeInput.addEventListener('change', updateOfferTarget);

  offerModal.addEventListener('click', (event) => {
    if (event.target === offerModal) {
      window.closeOfferModal();
    }
  });

  deleteOfferModal.addEventListener('click', (event) => {
    if (event.target === deleteOfferModal) {
      window.closeDeleteOfferModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      window.closeOfferModal();
      window.closeDeleteOfferModal();
    }
  });

  updateOfferTarget();
});
