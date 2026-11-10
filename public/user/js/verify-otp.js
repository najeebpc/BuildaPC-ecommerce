document.addEventListener('DOMContentLoaded', () => {
  const timer = document.getElementById('timer');
  const resendLink = document.getElementById('resend-Link');
  const timerText = document.getElementById('timer-text');
  const otpMessage = document.getElementById('otpMessage');
  const timerElement = document.getElementById('timer-container');
  const expiresAt = timerElement.dataset.expiresAt;
  let countdown;
  function startTimer(expiresAt) {
    clearInterval(countdown);
    const expiryTime = new Date(expiresAt).getTime();
    resendLink.classList.add('disabled');
    function updateTime() {
      const timeLeft = Math.ceil((expiryTime - Date.now()) / 1000);
      if (timeLeft <= 0) {
        clearInterval(countdown);
        timerText.textContent = "Didn't receive the code?";
        resendLink.classList.remove('disabled');

        return;
      }
      timerText.innerHTML = `Resend code in <strong><span id="timer">${timeLeft}</span>s</strong>`;
    }
    updateTime();
    countdown = setInterval(updateTime, 1000);
  }
  startTimer(expiresAt);

  resendLink.addEventListener('click', (e) => {
    e.preventDefault();

    fetch('/resend-otp', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          otpMessage.innerText = data.message;
          otpMessage.className = 'otp-message success';

          startTimer(data.expiresAt);
        } else {
          otpMessage.innerText = data.message;
          otpMessage.className = 'otp-message error';
        }
      });
  });
  const inputs = document.querySelectorAll('.code-box');

  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');

      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
      if (!pastedData) {
        return;
      }
      pastedData
        .slice(0, inputs.length)
        .split('')
        .forEach((digit, i) => {
          inputs[i].value = digit;
        });
      const lastIndex = Math.min(pastedData.length, inputs.length) - 1;
      if (lastIndex >= 0) {
        inputs[lastIndex].focus();
      }
    });
  });
});
function validateOtpForm() {
  const boxes = document.querySelectorAll('.code-box');

  let otpInput = '';
  boxes.forEach((box) => {
    otpInput += box.value.trim();
  });
  $.ajax({
    type: 'POST',
    url: '/verify-otp',
    contentType: 'application/json; charset=utf-8',
    dataType: 'json',
    data: JSON.stringify({ otp: otpInput }),
    success: function (response) {
      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Verified Successfully',
          showConfirmButton: false,
          timer: 1500,
        }).then(() => {
          window.location.href = response.redirectUrl;
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '',
          text: response.message,
        });
      }
    },
    error: function (xhr) {
      console.log('status:', xhr.status);
      console.log('response:', xhr.responseText);
      const message = xhr.responseJSON?.message || 'Somthing went wrong';
      Swal.fire({
        icon: 'error',
        title: '',
        text: message,
      });
    },
  });
  return false;
}
