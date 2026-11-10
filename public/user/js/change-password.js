const form = document.getElementById('changePasswordForm');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');

function validatePassword() {
  const val = passwordInput.value;
  if (!val) {
    passwordError.textContent = 'Password is required.';
    return false;
  }
  if (val.length < 8) {
    passwordError.textContent = 'Password must be at least 8 characters.';
    return false;
  }
  if (!/[A-Z]/.test(val)) {
    passwordError.textContent = 'Include at least one uppercase letter.';
    return false;
  }
  if (!/[a-z]/.test(val)) {
    passwordError.textContent = 'Include at least one lowercase letter.';
    return false;
  }
  if (!/[0-9]/.test(val)) {
    passwordError.textContent = 'Include at least one number.';
    return false;
  }
  if (!/[^A-Za-z0-9]/.test(val)) {
    passwordError.textContent = 'Include at least one special character.';
    return false;
  }
  passwordError.textContent = '';
  return true;
}
function validateConfirmPassword() {
  if (!confirmInput.value) {
    confirmPasswordError.textContent = 'Please confirm  your password';
    return false;
  }
  if (passwordInput.value !== confirmInput.value) {
    confirmPasswordError.textContent = 'Password do not match';
    return false;
  }
  confirmPasswordError.textContent = '';
  return true;
}
form.addEventListener('submit', function (e) {
  const isPasswordValid = validatePassword();
  const isConfirmValid = validateConfirmPassword();
  if (!isConfirmValid || !isPasswordValid) {
    e.preventDefault();
  }
});
passwordInput.addEventListener('input', () => {
  validatePassword();
  if (confirmInput.value) {
    validateConfirmPassword();
  }
});
confirmInput.addEventListener('input', () => {
  validateConfirmPassword();
});
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '⌣';
    button.title = 'hide';
  } else {
    input.type = 'password';
    button.textContent = '👁';
    button.title = 'show';
  }
}
