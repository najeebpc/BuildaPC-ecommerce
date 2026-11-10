document.addEventListener('DOMContentLoaded', () => {
  const nameid = document.getElementById('name');
  const emailid = document.getElementById('email');
  const passid = document.getElementById('password');
  const cpassid = document.getElementById('confirmPassword');

  const nameError = document.getElementById('nameError');
  const mailerror = document.getElementById('mailerror');
  const passerror = document.getElementById('passerror');
  const cpasserror = document.getElementById('cpasserror');

  const signform = document.getElementById('signform');
  const signupBtn = document.getElementById('signupBtn');

  if (!signform) {
    console.error("Form with id 'signform' not found.");
    return;
  }

  signform.setAttribute('novalidate', 'true');

  const emailRegex =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]{1,}[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  const nameRegex = /^[A-Za-z ]{3,}$/;

  function showError(elInput, elError, message) {
    elError.textContent = message;
    elInput.classList.add('invalid');
  }
  function clearError(elInput, elError) {
    elError.textContent = '';
    elInput.classList.remove('invalid');
  }

  function validateName() {
    const val = nameid.value.trim();
    if (!val) {
      showError(nameid, nameError, 'Name is required.');
      return false;
    }
    if (!nameRegex.test(val)) {
      showError(nameid, nameError, 'Enter a valid name (letters only).');
      return false;
    }
    clearError(nameid, nameError);
    return true;
  }

  function validateEmail() {
    const val = emailid.value.trim();
    if (!val) {
      showError(emailid, mailerror, 'Email is required.');
      return false;
    }
    if (!emailRegex.test(val) || val.split('@')[0].length < 3) {
      showError(emailid, mailerror, 'Please enter a valid email.');
      return false;
    }
    clearError(emailid, mailerror);
    return true;
  }

  function validatePassword() {
    const val = passid.value;
    if (!val) {
      showError(passid, passerror, 'Password is required.');
      return false;
    }
    if (val.length < 8) {
      showError(passid, passerror, 'Password must be at least 8 characters.');
      return false;
    }
    if (!/[A-Z]/.test(val)) {
      showError(passid, passerror, 'Inlcude at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(val)) {
      showError(passid, passerror, 'Include at least one lowercase letter.');
      return false;
    }
    if (!/[0-9]/.test(val)) {
      showError(passid, passerror, 'Include at least one number.');
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(val)) {
      showError(passid, passerror, 'Include at least one special character.');
      return false;
    }
    clearError(passid, passerror);
    return true;
  }

  function validateConfirmPassword() {
    const val = cpassid.value;
    if (!val) {
      showError(cpassid, cpasserror, 'Please confirm your password.');
      return false;
    }
    if (val !== passid.value) {
      showError(cpassid, cpasserror, 'Passwords do not match.');
      return false;
    }
    clearError(cpassid, cpasserror);
    return true;
  }

  nameid.addEventListener('input', validateName);
  emailid.addEventListener('input', validateEmail);
  passid.addEventListener('input', () => {
    validatePassword();
    if (cpassid.value) validateConfirmPassword();
  });
  cpassid.addEventListener('input', validateConfirmPassword);

  signform.addEventListener('submit', function (e) {
    const isNameOk = validateName();
    const isEmailOk = validateEmail();
    const isPassOk = validatePassword();
    const isCpassOk = validateConfirmPassword();

    const isFormValid = isNameOk && isEmailOk && isPassOk && isCpassOk;

    if (!isFormValid) {
      e.preventDefault();

      if (!isNameOk) nameid.focus();
      else if (!isEmailOk) emailid.focus();
      else if (!isPassOk) passid.focus();
      else if (!isCpassOk) cpassid.focus();
      return;
    }

    signupBtn.disabled = true;
    signupBtn.textContent = 'Signing up...';
    signform.submit();
  });
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
