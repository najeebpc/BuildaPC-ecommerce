document.addEventListener("DOMContentLoaded", () => {

  const timerText = document.getElementById("timer-text");
  const resendLink = document.getElementById("resend-Link");
  const otpMessage = document.getElementById("otpMessage");
  const verifyBtn = document.getElementById("verifyBtn");
  const inputs = document.querySelectorAll(".code-box");

  let countdown;
  let resendInProgress = false;

  function startTimer(expiresAt) {
    clearInterval(countdown);

    const expiryTime = new Date(expiresAt).getTime();

    resendLink.classList.add("disabled");

    function updateTime() {
      const timeLeft = Math.ceil((expiryTime - Date.now()) / 1000);

      if (timeLeft <= 0) {
        clearInterval(countdown);
        timerText.textContent = "Didn't receive the code?";
        resendLink.classList.remove("disabled");
        return;
      }

      timerText.innerHTML =
        `Resend code in <strong>${timeLeft}s</strong>`;
    }

    updateTime();
    countdown = setInterval(updateTime, 1000);
  }

  startTimer(window.otpExpiresAt);

  inputs.forEach((input, index) => {

    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");

      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();

      const pastedData = e.clipboardData
        .getData("text")
        .replace(/[^0-9]/g, "")
        .slice(0, inputs.length);

      pastedData.split("").forEach((digit, i) => {
        inputs[i].value = digit;
      });

      const lastIndex = pastedData.length - 1;

      if (lastIndex >= 0) {
        inputs[lastIndex].focus();
      }
    });

  });

  
  document.getElementById("otpform").addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = Array.from(inputs)
      .map(input => input.value.trim())
      .join("");

    if (!/^\d{6}$/.test(otp)) {
      otpMessage.textContent = "Please enter the complete 6-digit code.";
      return;
    }

    if (verifyBtn.disabled) return;

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifying...";

    try {
      const response = await fetch("/admin/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ otp })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        otpMessage.textContent = data.message || "OTP verification failed.";
        otpMessage.className = 'error-text'
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify";
        return;
      }

      Swal.fire({
        icon: "success",
        title: "OTP Verified Successfully",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        window.location.href = data.redirectUrl;
      });

    } catch (error) {
      console.log(error);

      otpMessage.textContent = "Something went wrong. Please try again.";
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify";
    }
  });


  resendLink.addEventListener("click", async (e) => {
    e.preventDefault();

    if (
      resendLink.classList.contains("disabled") ||
      resendInProgress
    ) {
      return;
    }

    resendInProgress = true;

    try {
      const response = await fetch("/admin/resend-otp", {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        otpMessage.textContent = data.message;
        otpMessage.className = "success-text";
        startTimer(data.expiresAt);
      } else {
        otpMessage.textContent = data.message;
        otpMessage.className = 'error-text';
      }

    } catch (error) {
      console.log(error);
      otpMessage.textContent = "Unable to resend code. Please try again.";
    } finally {
      resendInProgress = false;
    }
  });

});