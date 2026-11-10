document.addEventListener('DOMContentLoaded', async () => {
  const periodSelect = document.getElementById('salesPeriod');
  const yearSelect = document.getElementById('salesYear');
  const monthSelect = document.getElementById('salesMonth');
  const canvas = document.getElementById('salesChart');

  if (!periodSelect || !yearSelect || !monthSelect || !canvas) return;

  const now = new Date();

  for (let year = now.getFullYear(); year >= now.getFullYear() - 5; year--) {
    yearSelect.add(new Option(year, year));
  }

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  months.forEach((name, index) => {
    monthSelect.add(new Option(name, index + 1));
  });
  monthSelect.value = now.getMonth() + 1;

  let chart;
  function updateFilters() {
    const period = periodSelect.value;
    yearSelect.style.display = period === 'yearly' ? 'none' : '';
    monthSelect.style.display = period === 'daily' ? '' : 'none';
  }
  async function loadChart() {
    const params = new URLSearchParams({
      period: periodSelect.value,
      year: yearSelect.value,
      month: monthSelect.value,
    });
    try {
      const response = await fetch(`/admin/dashboard/sales-chart?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load sales data');
      }
      const result = await response.json();
      const sales = result.sales || [];
      let labels = [];
      let values = [];
      if (periodSelect.value === 'daily') {
        const daysInMonth = new Date(
          Number(yearSelect.value),
          Number(monthSelect.value),
          0,
        ).getDate();

        labels = Array.from({ length: daysInMonth }, (_, index) => String(index + 1));

        values = labels.map((day) => {
          const row = sales.find((item) => item._id.day === Number(day));
          return row ? row.totalSales : 0;
        });
      } else if (periodSelect.value === 'monthly') {
        labels = months;
        values = months.map((_, index) => {
          const row = sales.find((item) => item._id.month === index + 1);
          return row ? row.totalSales : 0;
        });
      } else {
        const yearData = new Map(sales.map((item) => [item._id.year, item.totalSales]));
        labels = Array.from(yearData.keys()).map(String);
        values = Array.from(yearData.values());
      }
      if (chart) chart.destroy();
      chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Sales (₹)',
              data: values,
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.12)',
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => '₹' + Number(value).toLocaleString('en-IN'),
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('Sales chart error:', error);
    }
  }
  periodSelect.addEventListener('change', () => {
    updateFilters();
    loadChart();
  });

  yearSelect.addEventListener('change', loadChart);
  monthSelect.addEventListener('change', loadChart);

  updateFilters();
  await loadChart();
});
