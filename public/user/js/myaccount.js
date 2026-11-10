const changePhotoBtn = document.getElementById('changePhotoBtn');
const profileImageInput = document.getElementById('profileImageInput');
const profileImageForm = document.getElementById('profileImageForm');
const profileImageError = document.getElementById('profileImageError');

const photoEditorModal = document.getElementById('photoEditorModal');
const photoEditorImage = document.getElementById('photoEditorImage');
const cancelPhotoEditBtn = document.getElementById('cancelPhotoEditBtn');
const savePhotoEditBtn = document.getElementById('savePhotoEditBtn');

let cropper = null;
changePhotoBtn.addEventListener('click', () => {
  profileImageInput.click();
});
profileImageInput.addEventListener('change', () => {
  const file = profileImageInput.files[0];
  if (!file) {
    return;
  }
  profileImageError.textContent = '';

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    profileImageError.textContent = 'Please select a JPG, PNG or WebP image';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    profileImageError.textContent = 'Image size must be less than 2MB';
    profileImageError.value = '';
    return;
  }
  const imageUrl = URL.createObjectURL(file);
  photoEditorImage.src = imageUrl;
  photoEditorModal.classList.add('active');
  photoEditorImage.onload = () => {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
    cropper = new Cropper(photoEditorImage, {
      aspectRatio: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      responsive: true,
      background: false,
    });
  };
});

cancelPhotoEditBtn.addEventListener('click', () => {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  photoEditorModal.classList.remove('active');
  profileImageInput.value = '';
});
savePhotoEditBtn.addEventListener('click', () => {
  if (!cropper) {
    return;
  }
  cropper
    .getCroppedCanvas({
      width: 500,
      height: 500,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    .toBlob(
      (blob) => {
        const file = new File([blob], 'profile-image-jpg', {
          type: 'image/jpeg',
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        profileImageInput.files = dataTransfer.files;
        photoEditorModal.classList.remove('active');
        cropper.destroy();
        cropper = null;
        profileImageForm.submit();
      },
      'image/jpeg',
      0.9,
    );
});
const editBtn = document.getElementById('editProfileBtn');
const saveBtn = document.getElementById('saveProfileBtn');
const profileForm = document.getElementById('profileForm');

const inputs = profileForm.querySelectorAll(
  'input[name="username"], input[name="fullName"], input[name="phone"]',
);

editBtn.addEventListener('click', () => {
  inputs.forEach((input) => {
    input.disabled = false;
    input.style.backgroundColor = '#fff';
  });

  editBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
});

profileForm.addEventListener('submit', (e) => {
  let valid = true;

  const fullName = profileForm.fullName;
  const phone = profileForm.phone;

  document.getElementById('fullNameError').textContent = '';
  document.getElementById('phoneError').textContent = '';

  if (fullName.value.trim() && fullName.value.trim().length < 3) {
    document.getElementById('fullNameError').textContent =
      'Full name must be at least 3 characters';
    valid = false;
  }

  if (phone.value && !/^\d{10}$/.test(phone.value.trim())) {
    document.getElementById('phoneError').textContent = 'Phone number must be exactly 10 digits';
    valid = false;
  }

  if (!valid) e.preventDefault();
});
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '⌣';
    button.title = 'hide';
  } else {
    ((input.type = 'password'), (button.textContent = '👁'));
    button.title = 'show';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const toastData = document.getElementById('profileToastData');
  if (!toastData) return;
  const successMessage = toastData.dataset.success;
  const errorMessage = toastData.dataset.error;
  if (successMessage) {
    showToastMessage(successMessage, 'success');
  }
  if (errorMessage) {
    showToastMessage(errorMessage, 'error');
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('changePasswordForm');

  if (!form) return;

  const currentPassword = document.getElementById('currentPassword');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('changePasswordBtn');

  const currentError = document.getElementById('currentPasswordError');
  const newError = document.getElementById('newPasswordError');
  const confirmError = document.getElementById('confirmPasswordError');

  function showError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.add('invalid');
  }

  function clearError(input, errorElement) {
    errorElement.textContent = '';
    input.classList.remove('invalid');
  }

  function validateCurrentPassword() {
    if (!currentPassword.value) {
      showError(currentPassword, currentError, 'Current password is required.');
      return false;
    }

    clearError(currentPassword, currentError);
    return true;
  }

  function validateNewPassword() {
    const value = newPassword.value;

    if (!value) {
      showError(newPassword, newError, 'New password is required.');
      return false;
    }

    if (value.length < 8) {
      showError(newPassword, newError, 'Password must be at least 8 characters.');
      return false;
    }

    if (!/[A-Z]/.test(value)) {
      showError(newPassword, newError, 'Include at least one uppercase letter.');
      return false;
    }

    if (!/[a-z]/.test(value)) {
      showError(newPassword, newError, 'Include at least one lowercase letter.');
      return false;
    }

    if (!/[0-9]/.test(value)) {
      showError(newPassword, newError, 'Include at least one number.');
      return false;
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      showError(newPassword, newError, 'Include at least one special character.');
      return false;
    }

    clearError(newPassword, newError);
    return true;
  }

  function validateConfirmPassword() {
    if (!confirmPassword.value) {
      showError(confirmPassword, confirmError, 'Please confirm your new password.');
      return false;
    }

    if (confirmPassword.value !== newPassword.value) {
      showError(confirmPassword, confirmError, 'Passwords do not match.');
      return false;
    }

    clearError(confirmPassword, confirmError);
    return true;
  }

  currentPassword.addEventListener('input', validateCurrentPassword);

  newPassword.addEventListener('input', () => {
    validateNewPassword();

    if (confirmPassword.value) {
      validateConfirmPassword();
    }
  });

  confirmPassword.addEventListener('input', validateConfirmPassword);

  form.addEventListener('submit', (event) => {
    const currentValid = validateCurrentPassword();
    const newValid = validateNewPassword();
    const confirmValid = validateConfirmPassword();

    if (!currentValid || !newValid || !confirmValid) {
      event.preventDefault();

      if (!currentValid) currentPassword.focus();
      else if (!newValid) newPassword.focus();
      else confirmPassword.focus();

      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating Password...';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const toastData = document.getElementById('changePasswordToastData');

  if (!toastData) return;

  const message = toastData.dataset.message;

  if (message) {
    showToastMessage(message, 'success');
  }
});
