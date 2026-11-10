let selectedAddressId = document.body.dataset.selectedAddressId||'';
const changeAddressBtn = document.getElementById('changeAddressBtn');

if (changeAddressBtn) {
  changeAddressBtn.addEventListener('click', function () {
    const checkoutAddressList = document.getElementById('checkoutAddressList');

    if (!checkoutAddressList) return;

    checkoutAddressList.classList.toggle('show');
  });
}
const selectAddressButtons = document.querySelectorAll('.select-address-btn');
selectAddressButtons.forEach((button) => {
  button.addEventListener('click', function () {
    const addressOption = this.closest('.checkout-address-option');
    if (!addressOption) return;
    selectedAddressId = addressOption.dataset.addressId;

    document.querySelectorAll('.checkout-address-option').forEach((option) => {
      option.classList.remove('selected');
    });
    addressOption.classList.add('selected');
    updateContinuePaymentButton();
    const addressName = addressOption.querySelector('.checkout-address-top h4').textContent.trim();
    const addressDetails = addressOption
      .querySelector('.checkout-address-content p')
      .textContent.trim();
    const addressPhone = addressOption.querySelector('.checkout-address-phone').textContent.trim();
    const selectedAddress = document.querySelector('.selected-address');
    if (selectedAddress) {
      const nameElement = selectedAddress.querySelector('.address-name');
      const detailsElement = selectedAddress.querySelector('.address-details');
      const phoneElement = selectedAddress.querySelector('.address-phone');
      if (nameElement) {
        nameElement.textContent = addressName;
      }
      if (detailsElement) {
        detailsElement.textContent = addressDetails;
      }
      if (phoneElement) {
        phoneElement.textContent = addressPhone;
      }
    }
    checkoutAddressList.classList.remove('show');
  });
});
const continuePaymentBtn = document.querySelector('.continue-payment-btn');
if (continuePaymentBtn) {
  continuePaymentBtn.addEventListener('click', async function () {
    if (!selectedAddressId) {
      showToastMessage('Please select a delivery address', 'error');
      return;
    }
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
      console.log('selected addressId', selectedAddressId);
      window.location.href = `/checkout/payment?addressId=${selectedAddressId}`;
    } catch (error) {
      showToastMessage('Unable to continue to payment', 'error');
    }
  });
}
const checkoutAddressModal = document.getElementById('checkoutAddressModal');
const addAddressBtn = document.getElementById('addAddressBtn');
const checkoutAddAddressBtn = document.getElementById('checkoutAddAddressBtn');
const closeCheckoutAddressModal = document.getElementById('closeCheckoutAddressModal');
const cancelCheckoutAddress = document.getElementById('cancelCheckoutAddress');
const checkoutAddressForm = document.getElementById('checkoutAddressForm');
function openCheckoutAddressModal() {
  checkoutAddressModal.classList.add('show');
}
function closeCheckoutAddressModalFunction() {
  checkoutAddressModal.classList.remove('show');
  checkoutAddressForm.reset();
  clearCheckoutAddressErrors();
}
if (addAddressBtn) {
  addAddressBtn.addEventListener('click', openCheckoutAddressModal);
}
if (checkoutAddAddressBtn) {
  checkoutAddAddressBtn.addEventListener('click', openCheckoutAddressModal);
}
if (closeCheckoutAddressModal) {
  closeCheckoutAddressModal.addEventListener('click', closeCheckoutAddressModalFunction);
}
if (cancelCheckoutAddress) {
  cancelCheckoutAddress.addEventListener('click', closeCheckoutAddressModalFunction);
}
function clearCheckoutAddressErrors() {
  document.getElementById('checkoutFullNameError').textContent = '';
  document.getElementById('checkoutPhoneError').textContent = '';
  document.getElementById('checkoutAddressLine1Error').textContent = '';
  document.getElementById('checkoutAddressLine2Error').textContent = '';
  document.getElementById('checkoutCityError').textContent = '';
  document.getElementById('checkoutStateError').textContent = '';
  document.getElementById('checkoutPincodeError').textContent = '';
}
function addNewAddressToCheckout(address) {
  const deliverySection = document.querySelector('.delivery-address');

  if (!deliverySection) return;

  const noAddress = deliverySection.querySelector('.no-address');

  if (noAddress) {
    noAddress.remove();
  }

  let selectedAddress = deliverySection.querySelector('.selected-address');

  if (!selectedAddress) {
    selectedAddress = document.createElement('div');

    selectedAddress.className = 'selected-address';

    selectedAddress.innerHTML = `
            <h3 class="address-name"></h3>

            <p class="address-details"></p>

            <p class="address-phone"></p>
        `;

    const addressHeader = deliverySection.querySelector('.address-header');

    addressHeader.insertAdjacentElement('afterend', selectedAddress);
  }

  selectedAddress.querySelector('.address-name').textContent = address.fullName;

  selectedAddress.querySelector('.address-details').textContent = `${address.addressLine1}${
    address.addressLine2 ? ', ' + address.addressLine2 : ''
  }, ${address.city}, ${address.state} - ${address.pincode}`;

  selectedAddress.querySelector('.address-phone').textContent = `Phone: ${address.phone}`;

  let changeAddressBtn = document.getElementById('changeAddressBtn');

  if (!changeAddressBtn) {
    changeAddressBtn = document.createElement('button');

    changeAddressBtn.type = 'button';

    changeAddressBtn.className = 'change-address-btn';

    changeAddressBtn.id = 'changeAddressBtn';

    changeAddressBtn.textContent = 'Change';

    const addressHeader = deliverySection.querySelector('.address-header');

    addressHeader.appendChild(changeAddressBtn);

    changeAddressBtn.addEventListener('click', function () {
      const addressList = document.getElementById('checkoutAddressList');

      if (!addressList) return;

      addressList.classList.toggle('show');
    });
  }

  let addressList = document.getElementById('checkoutAddressList');

  if (!addressList) {
    addressList = document.createElement('div');

    addressList.className = 'checkout-address-list';

    addressList.id = 'checkoutAddressList';

    addressList.innerHTML = `
            <div class="checkout-address-list-header">
                <h3>
                    Select Delivery Address
                </h3>
            </div>
        `;

    deliverySection.appendChild(addressList);
  }

  addressList.querySelectorAll('.checkout-address-option').forEach((option) => {
    option.classList.remove('selected');
  });

  const addressOption = document.createElement('div');

  addressOption.className = 'checkout-address-option selected';

  addressOption.dataset.addressId = address._id;

  addressOption.innerHTML = `
        <div class="checkout-address-content">

            <div class="checkout-address-top">

                <h4>
                    ${address.fullName}
                </h4>

            </div>

            <p>
                ${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''},
                ${address.city},
                ${address.state}
                - ${address.pincode}
            </p>

            <span class="checkout-address-phone">
                Phone: ${address.phone}
            </span>

        </div>

        <div class="checkout-address-actions">

            <a
                href="/account/address"
                class="checkout-edit-address"
            >
                Edit
            </a>

            <button
                type="button"
                class="select-address-btn"
            >
                Select
            </button>

        </div>
    `;

  const addAddressButton = document.getElementById('checkoutAddAddressBtn');

  if (addAddressButton) {
    addressList.insertBefore(addressOption, addAddressButton);
  } else {
    addressList.appendChild(addressOption);
  }

  selectedAddressId = address._id;

  updateContinuePaymentButton();

  const selectButton = addressOption.querySelector('.select-address-btn');

  selectButton.addEventListener('click', function () {
    selectedAddressId = addressOption.dataset.addressId;

    addressList.querySelectorAll('.checkout-address-option').forEach((option) => {
      option.classList.remove('selected');
    });

    addressOption.classList.add('selected');
    selectedAddress.querySelector('.address-name').textContent = address.fullName;

    selectedAddress.querySelector('.address-details').textContent = `${address.addressLine1}${
      address.addressLine2 ? ', ' + address.addressLine2 : ''
    }, ${address.city}, ${address.state} - ${address.pincode}`;

    selectedAddress.querySelector('.address-phone').textContent = `Phone: ${address.phone}`;

    updateContinuePaymentButton();

    addressList.classList.remove('show');
  });
}
function updateSelectedAddressDisplay(addressOption) {
  const addressName = addressOption.querySelector('.checkout-address-top h4').textContent.trim();

  const addressDetails = addressOption
    .querySelector('.checkout-address-content p')
    .textContent.trim();

  const addressPhone = addressOption.querySelector('.checkout-address-phone').textContent.trim();

  let selectedAddress = document.querySelector('.selected-address');

  if (!selectedAddress) {
    const deliverySection = document.querySelector('.delivery-address');

    const addressHeader = deliverySection.querySelector('.address-header');

    selectedAddress = document.createElement('div');

    selectedAddress.className = 'selected-address';

    selectedAddress.innerHTML = `
            <h3 class="address-name"></h3>
            <p class="address-details"></p>
            <p class="address-phone"></p>
        `;

    addressHeader.insertAdjacentElement('afterend', selectedAddress);
  }
  const nameElement = selectedAddress.querySelector('.address-name');

  const detailsElement = selectedAddress.querySelector('.address-details');

  const phoneElement = selectedAddress.querySelector('.address-phone');

  if (nameElement) {
    nameElement.textContent = addressName;
  }

  if (detailsElement) {
    detailsElement.textContent = addressDetails;
  }

  if (phoneElement) {
    phoneElement.textContent = addressPhone;
  }
}
checkoutAddressForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  clearCheckoutAddressErrors();
  let valid = true;
  const fullName = document.getElementById('checkoutFullName');
  const phone = document.getElementById('checkoutPhone');
  const addressLine1 = document.getElementById('checkoutAddressLine1');
  const addressLine2 = document.getElementById('checkoutAddressLine2');
  const city = document.getElementById('checkoutCity');
  const state = document.getElementById('checkoutState');
  const pincode = document.getElementById('checkoutPincode');

  const nameValue = fullName.value.trim();
  if (nameValue.length < 3 || !/^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(nameValue)) {
    document.getElementById('checkoutFullNameError').textContent = 'Plese enter a valid full name';

    valid = false;
  }

  if (!/^[6-9]\d{9}$/.test(phone.value.trim())) {
    document.getElementById('checkoutPhoneError').textContent = 'Please enter a valid phone number';

    valid = false;
  }

  if (!addressLine1.value.trim() || addressLine1.value.trim().length < 5) {
    document.getElementById('checkoutAddressLine1Error').textContent =
      'Please enter a valid address';

    valid = false;
  }

  if (!addressLine2.value.trim() || addressLine2.value.trim().length < 5) {
    document.getElementById('checkoutAddressLine2Error').textContent =
      'Please enter a valid address';

    valid = false;
  }

  if (!city.value.trim() || city.value.trim().length < 3) {
    document.getElementById('checkoutCityError').textContent = 'Please enter a valid city';

    valid = false;
  }

  if (!state.value) {
    document.getElementById('checkoutStateError').textContent = 'Please select a state';

    valid = false;
  }

  if (!/^\d{6}$/.test(pincode.value.trim())) {
    document.getElementById('checkoutPincodeError').textContent =
      'Pincode must be exactly 6 digits';

    valid = false;
  }

  if (!valid) {
    return;
  }

  try {
    const formData = new URLSearchParams(new FormData(checkoutAddressForm));
    const response = await fetch('/account/address', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    const result = await response.json();
    console.log('ADD ADDRESS RESPONSE:', result);
    console.log('RESPONSE STATUS:', response.status);
    if (!response.ok || !result.success) {
      showToastMessage(result.message || 'Unable to add address', 'error');
      return;
    }
    console.log('New address:', result.address);
    selectedAddressId = result.address._id;
    addNewAddressToCheckout(result.address);
    showToastMessage('Address added successfully', 'success');
    closeCheckoutAddressModalFunction();
  } catch (error) {
    console.error('Error saving checkout address:', error);
    showToastMessage('Unable to save address', 'error');
  }
});
updateContinuePaymentButton();
function updateContinuePaymentButton() {
  const continuePaymentBtn = document.querySelector('.continue-payment-btn');

  if (!continuePaymentBtn) return;

  if (selectedAddressId) {
    continuePaymentBtn.disabled = false;
  } else {
    continuePaymentBtn.disabled = true;
  }
}

const couponInput = document.getElementById('couponCode');
const applyCouponBtn = document.getElementById('applyCouponBtn');
const couponMessage = document.getElementById('couponMessage');
const appliedCoupon = document.getElementById('appliedCoupon');
const appliedCouponCode = document.getElementById('appliedCouponCode');
const removeCouponBtn = document.getElementById('removeCouponBtn');
const couponDiscountRow = document.getElementById('couponDiscountRow');
const couponDiscountAmount = document.getElementById('couponDiscountAmount');
const checkoutTotal = document.getElementById('checkoutTotal');

let currentCoupon = null;

function showCouponMessage(message, type) {
  couponMessage.textContent = message;
  couponMessage.className = `coupon-message ${type}`;
  couponMessage.hidden = false;
}
couponInput.addEventListener('input', () => {
  couponMessage.textContent = '';
  couponMessage.className = 'coupon-message';
  couponMessage.hidden = true;
});
function updateCouponUI(coupon) {
  currentCoupon = coupon;
  couponInput.closest('.coupon-form').hidden = Boolean(coupon);
  appliedCoupon.hidden = !coupon;
  couponDiscountRow.hidden = !coupon;

  if (coupon) {
    appliedCouponCode.textContent = coupon.code;
    couponDiscountAmount.textContent = `−₹${Number(coupon.discount).toLocaleString('en-IN')}`;
    checkoutTotal.textContent = `₹${Number(coupon.payableAmount).toLocaleString('en-IN')}`;
    couponMessage.hidden = true;
  } else {
    couponDiscountAmount.textContent = '−₹0';
    checkoutTotal.textContent = `₹${Number(checkoutTotal.dataset.subtotal).toLocaleString('en-IN')}`;
    couponMessage.hidden = true;
    couponInput.value = '';
  }
}
const couponSection = document.getElementById('couponSection');
let initialCoupon = null;
try {
  initialCoupon = JSON.parse(couponSection?.dataset.appliedCoupon || 'null');
} catch (error) {
  console.log('unable to restore coupon ', error);
}
if (initialCoupon) {
  updateCouponUI(initialCoupon);
}
applyCouponBtn.addEventListener('click', async () => {
  if (currentCoupon) {
    return;
  }
  const code = couponInput.value.trim().toUpperCase();
  if (!code) {
    showCouponMessage('Please enter a coupon code.', 'error');
    return;
  }
  applyCouponBtn.disabled = true;
  try {
    const response = await fetch('/checkout/apply-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showCouponMessage(result.message || 'Unable to apply coupon.', 'error');
      return;
    }
    updateCouponUI({
      code: result.coupon.code,
      discount: result.coupon.discount,
      payableAmount: result.coupon.payableAmount,
    });
  } catch (error) {
    showCouponMessage('Unable to apply coupon. Please try again.', 'error');
  } finally {
    applyCouponBtn.disabled = false;
  }
});
removeCouponBtn.addEventListener('click', async () => {
  removeCouponBtn.disabled = true;
  try {
    const response = await fetch('/checkout/remove-coupon', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    const result = await response.json();
    if (!response.ok) {
      showCouponMessage('Unable to remove coupon', 'error');
      return;
    }
    updateCouponUI(null);
    applyCouponBtn.disabled = false;
    couponInput.disabled = false;
    couponMessage.hidden = true;
  } catch (error) {
    showCouponMessage('Unable to remove coupon. try again', 'error');
  } finally {
    removeCouponBtn.disabled = false;
  }
});
