const cancelOrderModal = document.getElementById('cancelOrderModal');
const cancelModalClose = document.getElementById('cancelModalClose');
const cancelModalCancel = document.getElementById('cancelModalCancel');
const confirmCancelOrder = document.getElementById('confirmCancelOrder');
const cancellationReason = document.getElementById('cancellationReason');
let selectedOrderId = null;

const cancelOrderButtons = document.querySelectorAll('.cancel-order-btn');
cancelOrderButtons.forEach((button) => {
  button.addEventListener('click', function () {
    selectedOrderId = this.dataset.orderId;
    cancellationReason.value = '';
    cancelOrderModal.classList.add('show');
  });
});
function closeCancelModal() {
  cancelOrderModal.classList.remove('show');
  selectedOrderId = null;
  cancellationReason.value = '';
  confirmCancelOrder.disabled = false;
  confirmCancelOrder.textContent = 'Confirm Cancellation';
}
cancelModalClose.addEventListener('click', closeCancelModal);
cancelModalCancel.addEventListener('click', closeCancelModal);

document.querySelector('.cancel-order-modal-overlay').addEventListener('click', closeCancelModal);

confirmCancelOrder.addEventListener('click', async function () {
  if (!selectedOrderId) {
    return;
  }
  const reason = cancellationReason.value.trim();
  confirmCancelOrder.disabled = true;
  confirmCancelOrder.textContent = 'Cancelling...';
  try {
    const response = await fetch(`/account/orders/${selectedOrderId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        cancellationReason: reason,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToastMessage(result.message || 'Unable to cancel order', 'error');
      confirmCancelOrder.disabled = false;
      confirmCancelOrder.textContent = 'Confirm Cancellation';
      return;
    }
    closeCancelModal();
    showToastMessage(result.message || 'Order cancelled successfully', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.log('Cancel order error:', error);
    showToastMessage('Unable to cancel order', 'error');
    confirmCancelOrder.disabled = false;
    confirmCancelOrder.textContent = 'Confirm Cancellation';
  }
});

const cancelItemModal = document.getElementById('cancelItemModal');
const cancelItemModalClose = document.getElementById('cancelItemModalClose');
const cancelItemModalCancel = document.getElementById('cancelItemModalCancel');
const confirmCancelItem = document.getElementById('confirmCancelItem');
const itemCancellationReason = document.getElementById('itemCancellationReason');
const cancelItemConfirmation = document.getElementById('cancelItemConfirmation');
const couponWarning = document.getElementById('couponWarning');
let selectedItemOrderId = null;
let selectedItemId = null;
document.querySelectorAll('.cancel-item-btn').forEach((button) => {
  button.addEventListener('click', async function () {
    selectedItemOrderId = this.dataset.orderId;
    selectedItemId = this.dataset.itemId;
    itemCancellationReason.value = '';
    cancelItemConfirmation.textContent = `Are you sure want to cancel ${this.dataset.productName}?`;
    couponWarning.hidden = true;
    couponWarning.textContent = '';
    try {
      const response = await fetch(
        `/account/orders/${encodeURIComponent(selectedItemOrderId)}/items/${encodeURIComponent(selectedItemId)}/cancellation-impact`,
        {
          headers: { Accept: 'application/json' },
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToastMessage(result.message || 'Unable to check cancellation details', 'error');
        return;
      }
      if (result.couponRemoved) {
        couponWarning.textContent = `Warning: Cancelling this item will remove your coupon discount,
                 because your remaining order value will be below the minimum puchase requirment.`;
        couponWarning.hidden = false;
      }
      cancelItemModal.classList.add('show');
    } catch (error) {
      console.log(error);
      showToastMessage('Unable to check cancellation details. Please try again.', 'error');
    }
  });
});
function closeCancelItemModal() {
  cancelItemModal.classList.remove('show');
  selectedItemOrderId = null;
  selectedItemId = null;
  itemCancellationReason.value = '';
  confirmCancelItem.disabled = false;
  confirmCancelItem.textContent = 'Confirm Cancellation';
}
cancelItemModalClose.addEventListener('click', closeCancelItemModal);
cancelItemModalCancel.addEventListener('click', closeCancelItemModal);
cancelItemModal
  .querySelector('.cancel-order-modal-overlay')
  .addEventListener('click', closeCancelItemModal);
confirmCancelItem.addEventListener('click', async function () {
  console.log('confirm button clicked item id and order id', selectedItemId, selectedItemOrderId);
  if (!selectedItemId || !selectedItemOrderId) {
    return;
  }
  confirmCancelItem.disabled = true;
  confirmCancelItem.textContent = 'Cancelling..';
  try {
    const response = await fetch(
      `/account/orders/${encodeURIComponent(selectedItemOrderId)}/items/${encodeURIComponent(selectedItemId)}/cancel`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ cancellationReason: itemCancellationReason.value.trim() }),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToastMessage(result.message, 'error');
      confirmCancelItem.disabled = false;
      confirmCancelItem.textContent = 'Confirm Cancellation';
      return;
    }
    closeCancelItemModal();
    showToastMessage(result.message, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    showToastMessage('Unable to cancel item', 'error');
    confirmCancelItem.disabled = false;
    confirmCancelItem.textContent = 'Confirm Cancellation';
  }
});

const returnOrderModal = document.getElementById('returnOrderModal');
const returnModalClose = document.getElementById('returnModalClose');
const returnModalCancel = document.getElementById('returnModalCancel');
const confirmReturnOrder = document.getElementById('confirmReturnOrder');
const returnReason = document.getElementById('returnReason');
const returnReasonError = document.getElementById('returnReasonError');
let selectedReturnOrderId = null;
let selectedReturnItemId = null;
document.querySelectorAll('.return-item-btn').forEach((button) => {
  button.addEventListener('click', function () {
    selectedReturnOrderId = this.dataset.orderId;
    selectedReturnItemId = this.dataset.itemId;
    returnReason.value = '';
    returnReasonError.textContent = '';
    document.querySelector('.return-confirmation-text').textContent =
      `Are you sure you want to return ${this.dataset.productName}?`;
    confirmReturnOrder.textContent = 'Confirm Return';
    returnOrderModal.classList.add('show');
  });
});
function closeReturnModal() {
  returnOrderModal.classList.remove('show');
  selectedReturnItemId = null;
  selectedReturnOrderId = null;
  returnReason.value = '';
  returnReasonError.textContent = '';
  confirmReturnOrder.disabled = false;
  confirmReturnOrder.textContent = 'Confirm Return';
}
returnModalCancel.addEventListener('click', closeReturnModal);
returnModalClose.addEventListener('click', closeReturnModal);
returnOrderModal
  .querySelector('.return-order-modal-overlay')
  .addEventListener('click', closeReturnModal);
confirmReturnOrder.addEventListener('click', async function () {
  if (!selectedReturnOrderId || !selectedReturnItemId) {
    return;
  }

  const reason = returnReason.value.trim();
  console.log('return reason', reason);
  if (!reason) {
    returnReasonError.textContent = 'Return reason is required';
    returnReason.focus();
    return;
  }
  returnReasonError.textContent = '';
  confirmReturnOrder.disabled = true;
  confirmReturnOrder.textContent = 'Submitting...';
  try {
    const response = await fetch(
      `/account/orders/${encodeURIComponent(selectedReturnOrderId)}/items/${encodeURIComponent(selectedReturnItemId)}/return`,
      {
        method: 'PATCH',
        headers: { 'Content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ returnReason: reason }),
      },
    );
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToastMessage(result.message, 'error');
      confirmReturnOrder.disabled = false;
      confirmReturnOrder.textContent = 'Confirm Return';
      return;
    }
    closeReturnModal();
    showToastMessage(result.message, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  } catch (error) {
    console.log('Return item error', error);
    showToastMessage('Unable to request item return', 'error');
    confirmReturnOrder.disabled = false;
    confirmReturnOrder.textContent = 'Confirm Return';
  }
});
