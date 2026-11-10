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

const returnOrderModal = document.getElementById('returnOrderModal');
const returnModalClose = document.getElementById('returnModalClose');
const returnModalCancel = document.getElementById('returnModalCancel');
const confirmReturnOrder = document.getElementById('confirmReturnOrder');
const returnReason = document.getElementById('returnReason');
const returnReasonError = document.getElementById('returnReasonError');
let selectedReturnOrderId = null;
const returnOrderButtons = document.querySelectorAll('.return-order-btn');
returnOrderButtons.forEach((button) => {
  button.addEventListener('click', function () {
    selectedReturnOrderId = this.dataset.orderId;
    returnReason.value = '';
    returnReasonError.textContent = '';
    returnOrderModal.classList.add('show');
  });
});
function closeReturnModal() {
  returnOrderModal.classList.remove('show');
  selectedReturnOrderId = null;
  returnReason.value = '';
  returnReasonError.textContent = '';
  confirmReturnOrder.disabled = false;
  confirmReturnOrder.textContent = 'Confirm Return';
}
returnModalClose.addEventListener('click', closeReturnModal);
returnModalCancel.addEventListener('click', closeReturnModal);
document.querySelector('.return-order-modal-overlay').addEventListener('click', closeReturnModal);

confirmReturnOrder.addEventListener('click', async function () {
  if (!selectedReturnOrderId) {
    return;
  }
  const reason = returnReason.value.trim();
  if (!reason) {
    returnReasonError.textContent = 'Return reason is required';
    returnReason.focus();
    return;
  }
  returnReasonError.textContent = '';
  confirmReturnOrder.disabled = true;
  confirmReturnOrder.textContent = 'Returning...';
  try {
    const response = await fetch(`/account/orders/${selectedReturnOrderId}/return`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        returnReason: reason,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToastMessage(result.message || 'Unable to return order', 'error');
      confirmReturnOrder.disabled = false;
      confirmReturnOrder.textContent = 'Confirm Return';
      return;
    }
    closeReturnModal();
    showToastMessage(result.message || 'Order returned successfully', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.log('Return order error:', error);
    showToastMessage('Unable to return order', 'error');
    confirmReturnOrder.disabled = false;
    confirmReturnOrder.textContent = 'Confirm Return';
  }
});

