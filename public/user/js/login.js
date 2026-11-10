const form = document.getElementById('signForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const mailerror = document.getElementById('mailError');
const passerror = document.getElementById('passError');

form.addEventListener('submit', (e) => {
  mailerror.textContent = '';
  passerror.textContent = '';

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email) {
    e.preventDefault();
    mailerror.textContent = 'Email is required';
    return;
  }
  if (!validateEmail(email)) {
    e.preventDefault();
    mailerror.textContent = 'Eneter a valid email';
    return;
  }
  if (!password) {
    e.preventDefault();
    passerror.textContent = 'Password is required';
    return;
  }
});
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
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
