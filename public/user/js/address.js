const addBtn = document.getElementById('addBtn');
const addressForm = document.getElementById('addressForm');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const addressFormElement = document.getElementById('addressFormElement');

addBtn.addEventListener('click', () => {
  resetAddressForm();
  addressForm.style.display = 'block';
});

cancelBtn.addEventListener('click', () => {
  resetAddressForm();
  addressForm.style.display = 'none';
});

addressFormElement.addEventListener('submit', (e) => {
  let valid = true;
  clearErrors();

  const fullName = document.getElementById('fullName');
  const phone = document.getElementById('phone');
  const addressLine1 = document.getElementById('addressLine1');
  const addressLine2 = document.getElementById('addressLine2');
  const city = document.getElementById('city');
  const state = document.getElementById('state');
  const pincode = document.getElementById('pincode');
  const nameValue = fullName.value.trim();
  if (nameValue.length < 3 || !/^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u.test(nameValue)) {
    document.getElementById('fullNameError').textContent = 'Please enter a valid name';
    valid = false;
  }
  if (!/^[6-9]\d{9}$/.test(phone.value.trim())) {
    document.getElementById('phoneError').textContent = 'phone number must be 10 digits';
    valid = false;
  }
  if (!addressLine1.value.trim() || addressLine1.value.trim().length < 5) {
    document.getElementById('addressLine1Error').textContent = 'please enter a valid address';
    valid = false;
  }
  if (!addressLine2.value.trim() || addressLine2.value.trim().length < 5) {
    document.getElementById('addressLine2Error').textContent = 'please enter a valid address';
    valid = false;
  }
  if (!city.value.trim() || city.value.trim().length < 3) {
    document.getElementById('cityError').textContent = 'please enter a valid city';
    valid = false;
  }
  if (!state.value) {
    document.getElementById('stateError').textContent = 'Please select a state';
    valid = false;
  }
  if (!/^\d{6}$/.test(pincode.value.trim())) {
    document.getElementById('pincodeError').textContent = 'Pincode must be exactly 6 digits';
    valid = false;
  }
  if (!valid) {
    e.preventDefault();
  }
});
function clearErrors() {
  document.getElementById('fullNameError').textContent = '';
  document.getElementById('phoneError').textContent = '';
  document.getElementById('addressLine1Error').textContent = '';
  document.getElementById('addressLine2Error').textContent = '';
  document.getElementById('cityError').textContent = '';
  document.getElementById('stateError').textContent = '';
  document.getElementById('pincodeError').textContent = '';
}

function resetAddressForm() {
  addressFormElement.reset();
  addressFormElement.action = '/account/address';
  document.getElementById('formTitle').textContent = 'Add New Address';
  saveBtn.textContent = 'Save';
  clearErrors();
}
const editButtons = document.querySelectorAll('.edit');
editButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    const addressId = button.dataset.id;

    try {
      const response = await fetch(`/account/address/${addressId}`);
      if (!response.ok) {
        throw new Error('failed to load address');
      }
      const address = await response.json();

      addressForm.style.display = 'block';

      document.getElementById('fullName').value = address.fullName;

      document.getElementById('phone').value = address.phone;

      document.getElementById('addressLine1').value = address.addressLine1;

      document.getElementById('addressLine2').value = address.addressLine2 || '';

      document.getElementById('city').value = address.city;

      document.getElementById('state').value = address.state;

      document.getElementById('pincode').value = address.pincode;

      addressFormElement.action = `/account/address/${addressId}/update`;
      document.getElementById('formTitle').textContent = 'Edit Address';
      saveBtn.textContent = 'Update';
    } catch (error) {
      console.error('Error', error);
    }
  });
});

const deleteAddressModal = document.getElementById('deleteAddressModal');
const closeAddressModal = document.getElementById('closeAddressModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const addressModalTitle = document.getElementById('addressModalTilte');
const addressModalText = document.getElementById('addressModalText');
const addressList = document.getElementById('addressList');

let selectedAddressId = null;
const deleteButtons = document.querySelectorAll('.delete');
deleteButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedAddressId = button.dataset.id;
    deleteAddressModal.style.display = 'flex';
  });
});
function closeModal() {
  deleteAddressModal.style.display = 'none';
  selectedAddressId = null;
}
closeAddressModal.addEventListener('click', closeModal);
cancelDeleteBtn.addEventListener('click', closeModal);

confirmDeleteBtn.addEventListener(
  'click',

  async () => {
    if (!selectedAddressId) {
      return;
    }
    try {
      const response = await fetch(`/account/address/${selectedAddressId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        showAddressMessage(data.message, 'error');
        return;
      }
      showToastMessage(data.message, 'success');
      const addressCard = document.querySelector(`.address-card[data-id="${selectedAddressId}"]`);
      if (addressCard) {
        addressCard.remove();
      }
      if (addressList.querySelectorAll('.address-card').length === 0) {
        addressList.innerHTML = `
                    <div class="account-card address-empty">

                        <h4>No addresses yet</h4>

                        <p>
                            Add an address to make your checkout
                            faster and easier.
                        </p>

                    </div>
                `;
      }
      closeModal();
    } catch (error) {
      console.log('Delete error', error);
      closeModal();
    }
  },
);

function addSetDefaultListener(button) {
  button.addEventListener('click', async () => {
    const addressId = button.dataset.id;
    try {
      const response = await fetch(`/account/address/${addressId}/default`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set default address');
      }
      document.querySelectorAll('.default-badge').forEach((badge) => {
        badge.remove();
      });
      document.querySelectorAll('.address-card').forEach((card) => {
        const actions = card.querySelector('.address-actions');
        const existingButton = card.querySelector('.set-default');
        if (!existingButton) {
          const newButton = document.createElement('span');
          newButton.type = 'span';
          newButton.className = 'set-default';
          newButton.dataset.id = card.dataset.id;
          newButton.textContent = 'Set as Default';
          actions.prepend(newButton);
          addSetDefaultListener(newButton);
        }
      });
      const selectedCard = document.querySelector(`.address-card[data-id="${addressId}"]`);
      if (selectedCard) {
        const addressTop = selectedCard.querySelector('.address-top');
        const badge = document.createElement('span');
        badge.className = 'default-badge';
        badge.textContent = 'Default';
        addressTop.appendChild(badge);

        const selectedBtn = selectedCard.querySelector('.set-default');
        if (selectedBtn) {
          selectedBtn.remove();
        }
      }
    } catch (error) {
      console.error(error);
    }
  });
}
document.querySelectorAll('.set-default').forEach((button) => {
  addSetDefaultListener(button);
});
function showAddressMessage(message, type) {
  const messageBox = document.getElementById('addressMessage');
  messageBox.textContent = message;
  messageBox.classList.remove('success', 'error');
  messageBox.classList.add(type);
}
