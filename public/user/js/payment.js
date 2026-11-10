const paymentMethods = document.querySelectorAll('.payment-method');
const paymentGateways = document.querySelectorAll('.payment-gateway');

let selectedPaymentMethod = 'cod';
let selectedPaymentGateway = 'null';
paymentMethods.forEach((method) => {
  method.addEventListener('click', function () {
    paymentMethods.forEach((item) => {
      item.classList.remove('selected');
    });
    paymentGateways.forEach((gateway) => {
      gateway.classList.remove('selected');
      gateway.setAttribute('aria-pressed', 'false');
    });
    this.classList.add('selected');
    selectedPaymentMethod = this.dataset.paymentMethod;
    selectedPaymentGateway = null;
  });
});
paymentGateways.forEach((gateway) => {
  function selectGateway() {
    paymentMethods.forEach((method) => {
      method.classList.remove('selected');
    });
    paymentGateways.forEach((item) => {
      item.classList.remove('selected');
      item.setAttribute('aria-pressed', 'false');
    });
    gateway.classList.add('selected');
    gateway.setAttribute('aria-pressed', 'true');
    selectedPaymentMethod = 'online';
    selectedPaymentGateway = gateway.dataset.paymentGateway;
  }
  gateway.addEventListener('click', function (event) {
    event.stopPropagation();
    selectGateway();
  });
});
const placeOrderBtn = document.getElementById('placeOrderBtn');
if (placeOrderBtn) {
  placeOrderBtn.addEventListener('click', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const addressId = urlParams.get('addressId');
    if (!addressId) {
      showToastMessage('Delivery address is required', 'error');
      return;
    }
    if (!selectedPaymentMethod) {
      showToastMessage('Please select a payment method', 'error');
      return;
    }
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order...';
    try {
      if (selectedPaymentMethod === 'cod') {
        const response = await fetch('/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            addressId,
            paymentMethod: selectedPaymentMethod,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          showToastMessage(result.message || 'Unable to place order', 'error');
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Place Order';
          return;
        }
        window.location.href = `/order-success/${result.orderId}`;
        return;
      }
      if (selectedPaymentMethod === 'wallet') {
        const response = await fetch('/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ addressId, paymentMethod: selectedPaymentMethod }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          showToastMessage(result.message, 'error');
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Place Order';
          return;
        }
        window.location.href = `/order-success/${result.orderId}`;
        return;
      }
      if (selectedPaymentMethod === 'online') {
        if (typeof Razorpay === 'undefined') {
          throw new Error('Payment service could not be loaded. Please try again');
        }
        const response = await fetch('/order/online/create', {
          method: 'POST',
          headers: { 'Content-type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ addressId }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message);
        }
        const options = {
          key: result.key,
          amount: result.amount,
          currency: result.currency,
          name: 'BuildaPC',
          description: 'Order payment',
          order_id: result.razorpayOrderId,
          handler: async function (paymentResponse) {
            try {
              placeOrderBtn.textContent = 'Verifying Payment...';
              const verifyResponse = await fetch('/order/online/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                  addressId,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              });

              const verifyResult = await verifyResponse.json();

              if (!verifyResponse.ok || !verifyResult.success) {
                throw new Error(verifyResult.message || 'payment verification failed');
              }
              window.location.href = `/order-success/${verifyResult.orderId}`;
            } catch (error) {
              console.log('Payment verification error', error);
              showToastMessage(error.message, 'error');
              placeOrderBtn.disabled = false;
              placeOrderBtn.textContent = 'Retry Payment';
            }
          },

          modal: {
            ondismiss: function () {
              placeOrderBtn.disabled = false;
              placeOrderBtn.textContent = 'Place Order';
            },
          },
          theme: { color: '#2563eb' },
        };
        const razorpayCheckout = new Razorpay(options);
        razorpayCheckout.on('payment.failed', function (response) {
          const error = response.error || {};
          showPaymentFailureModal({
            message: 'Your payment could not be processed at this time.',
            reasons: [
              error.description || 'The payment was declined or could not be completed.',
              'Please check your payment details or try another payment method.',
            ],
          });
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Retry Payment';
        });
        razorpayCheckout.open();
      }
    } catch (error) {
      console.log('Place order error:', error);
      showToastMessage(error.message || 'Unable to place order', 'error');
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  });
}
function showPaymentFailureModal(failure) {
  const modal = document.getElementById('paymentFailureModal');
  const message = document.getElementById('failureMessage');
  const reasonsList = document.getElementById('failureReasons');
  message.textContent = failure.message || 'Your payment could not be processed at this time';
  reasonsList.replaceChildren();
  const reasons = Array.isArray(failure.reasons) ? failure.reasons : [];
  reasons.forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonsList.appendChild(li);
  });
  modal.hidden = false;
}
function hidePaymentFailureModal() {
  document.getElementById('paymentFailureModal').hidden = true;
}
document.getElementById('retryPaymentBtn').addEventListener('click', () => {
  hidePaymentFailureModal();
  placeOrderBtn.click();
});
document.getElementById('differentPaymentBtn').addEventListener('click', () => {
  hidePaymentFailureModal();
});
document.getElementById('returnToCartBtn').addEventListener('click', () => {
  window.location.href = '/cart';
});
