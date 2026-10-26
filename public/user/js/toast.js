 function showToastMessage(message,type){
        const toast = document.getElementById('toastMessage');
        const text = document.getElementById('toastMessageText');
         console.log('MESSAGE:', message);
         console.log('TYPE:', type);
        text.textContent = message;
        toast.classList.remove('success','error','show')
        toast.classList.add(type);
        toast.classList.add('show')
        setTimeout(() => {
            toast.classList.remove('show')
            toast.classList.remove('success')
            toast.classList.remove('error')
        }, 4000);
    }