function applyOrderFilters() {
  const status = document.getElementById('orderStatusFilter').value;
  const sort = document.getElementById('orderSort').value;
  const search = '<%= search || "" %>';
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  if (status) {
    params.set('status', status);
  }
  if (sort) {
    params.set('sort', sort);
  }
  window.location.href = `/admin/orders?${params.toString()}`;
}
async function updateOrderStatus(select) {
  const orderId = select.dataset.orderId;
  const orderStatus = select.value;

  try {
    const response = await fetch(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },

      body: JSON.stringify({
        orderStatus,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      showToastMessage(result.message, 'error');
      setTimeout(() => {
        window.location.reload();
      }, 1300);

      return;
    }
    window.location.reload();
  } catch (error) {
    console.log('Update order status error:', error);
    alert('Unable to update order status');
    window.location.reload();
  }
}
