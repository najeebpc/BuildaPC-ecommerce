
let toastTimeout;
function showToastMessage(message, type) {
    const toast = document.getElementById('toastMessage');
    const text = document.getElementById('toastMessageText');

    if (!toast || !text) {
        console.warn('Toast elements not found');
        return;
    }

    clearTimeout(toastTimeout);

    text.textContent = message;

    toast.classList.remove('success', 'error', 'show');
    toast.classList.add(type === 'error' ? 'error' : 'success');
    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show', 'success', 'error');
    }, 5000);
}