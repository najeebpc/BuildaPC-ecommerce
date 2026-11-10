const couponModal = document.getElementById('couponModal');
const couponForm = document.getElementById('couponForm');
const couponSaveBtn = document.getElementById('couponSaveBtn');

const discountTypeInput = document.getElementById('discountType');
const discountValueInput = document.getElementById('discountValue');
const maxDiscountGroup = document.getElementById('maxDiscountGroup');
const maxDiscountInput = document.getElementById('maxDiscount');

const deleteCouponModal = document.getElementById('deleteCouponModal');
const deleteCouponText = document.getElementById('deleteCouponText');
const confirmCouponDeleteBtn = document.getElementById('confirmCouponDeleteBtn');

let selectedCouponId = null;
let isCouponSaving = false;
let isCouponDeleting = false;

function openAddCouponModal() {
  couponForm.reset();
  document.getElementById('minOrderAmount').value = '0';
  document.getElementById('perUserLimit').value = '1';
  updateDiscountFields();
  couponModal.style.display = 'flex';
}

function closeCouponModal() {
  if (isCouponSaving) return;
  couponModal.style.display = 'none';
}

function updateDiscountFields() {
  const isPercentage = discountTypeInput.value === 'percentage';

  maxDiscountGroup.hidden = !isPercentage;
  maxDiscountInput.disabled = !isPercentage;
  maxDiscountInput.required = false;

  discountValueInput.max = isPercentage ? '100' : '';

  if (!isPercentage) {
    maxDiscountInput.value = '';
  }
}

discountTypeInput.addEventListener('change', updateDiscountFields);
couponForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  if (isCouponSaving) return;
  const startDate = new Date(document.getElementById('startDate').value);
  const expiryDate = new Date(document.getElementById('expiryDate').value);
  if (expiryDate <= startDate) {
    showToastMessage('Expiry date must be after the start date', 'error');
    return;
  }
  isCouponSaving = true;
  couponSaveBtn.disabled = true;
  couponSaveBtn.textContent = 'Creating...';
  try {
    const formData = new FormData(couponForm);
    const couponData = Object.fromEntries(formData.entries());

    couponData.code = couponData.code.trim().toUpperCase();
    couponData.discountValue = Number(couponData.discountValue);
    couponData.minOrderAmount = Number(couponData.minOrderAmount);
    couponData.usageLimit = Number(couponData.usageLimit);
    couponData.perUserLimit = Number(couponData.perUserLimit);
    if (
      couponData.discountType === 'fixed' &&
      couponData.discountValue >= couponData.minOrderAmount
    ) {
      showToastMessage('Fixed discount must be less than the minimum order amount', 'error');
      return;
    }
    if (couponData.discountType === 'percentage' && couponData.maxDiscount) {
      couponData.maxDiscount = Number(couponData.maxDiscount);
    } else {
      couponData.maxDiscount = null;
    }

    const response = await fetch('/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(couponData),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToastMessage(result.message || 'Unable to create coupon', 'error');
      return;
    }
    showToastMessage(result.message, 'success');
    closeCouponModalAfterSave();

    setTimeout(() => window.location.reload(), 1500);
  } catch (error) {
    showToastMessage(error.message || 'Unable to create coupon', 'error');
  } finally {
    isCouponSaving = false;
    couponSaveBtn.disabled = false;
    couponSaveBtn.textContent = 'Create Coupon';
  }
});

function closeCouponModalAfterSave() {
  couponModal.style.display = 'none';
}

function openDeleteCouponModal(button) {
  selectedCouponId = button.dataset.id;
  const couponCode = button.dataset.code;

  deleteCouponText.textContent = `Are you sure you want to delete coupon "${couponCode}"?`;

  deleteCouponModal.style.display = 'flex';
}

function closeDeleteCouponModal() {
  if (isCouponDeleting) return;
  deleteCouponModal.style.display = 'none';
  selectedCouponId = null;
}

confirmCouponDeleteBtn.addEventListener('click', async function () {
  if (!selectedCouponId || isCouponDeleting) return;

  isCouponDeleting = true;
  confirmCouponDeleteBtn.disabled = true;
  confirmCouponDeleteBtn.textContent = 'Deleting...';

  try {
    const response = await fetch(`/admin/coupons/${selectedCouponId}`, { method: 'DELETE' });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showToastMessage(result.message || 'Unable to delete coupon', 'error');
      return;
    }

    deleteCouponModal.style.display = 'none';
    selectedCouponId = null;

    showToastMessage(result.message, 'success');

    setTimeout(() => window.location.reload(), 700);
  } catch (error) {
    showToastMessage(error.message || 'Unable to delete coupon', 'error');
  } finally {
    isCouponDeleting = false;
    confirmCouponDeleteBtn.disabled = false;
    confirmCouponDeleteBtn.textContent = 'Delete Coupon';
  }
});

window.addEventListener('click', function (event) {
  if (event.target === couponModal) {
    closeCouponModal();
  }

  if (event.target === deleteCouponModal) {
    closeDeleteCouponModal();
  }
});
updateDiscountFields();
document.querySelectorAll('.coupon-status-toggle').forEach((toggle) => {
  toggle.addEventListener('change', async function () {
    const couponId = this.dataset.couponId;
    const status = this.checked;
    const previousStatus = !status;
    try {
      const response = await fetch(`/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        this.checked = previousStatus;
        showToastMessage(result.message, 'error');
        return;
      }

      showToastMessage(result.message, 'success');
      window.location.reload();
    } catch (error) {
      this.checked = previousStatus;
      showToastMessage(error.message, 'error');
    }
  });
});
