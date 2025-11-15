// Script for public profile view on btb.fit

(function() {
  // Helper functions reused from main script
  function computeBMI(weight, heightCm) {
    const heightMeters = heightCm / 100;
    return weight / (heightMeters * heightMeters);
  }
  function bmiCategory(bmi) {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  // Compute a simple athleticism score based on muscle percentage and BMI
  function computeAthleticism(weightKg, heightCm, musclePercent) {
    const bmi = computeBMI(weightKg, heightCm);
    return musclePercent - (bmi - 22);
  }

  const params = new URLSearchParams(window.location.search);
  const user = params.get('user');
  const userLabel = document.getElementById('profile-user');
  if (!user) {
    userLabel.textContent = 'No user specified';
    return;
  }
  
  // Check if profile is public
  const isPublic = localStorage.getItem(`btb_profile_public_${user}`) !== 'false';
  if (!isPublic) {
    userLabel.textContent = `Profile: ${user} (Private)`;
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.innerHTML = '<h2>This profile is private</h2><p>The user has chosen to keep their profile private.</p>';
    });
    return;
  }
  
  userLabel.textContent = `Profile: ${user}`;

  // Load entries for specified user
  let entries = [];
  const raw = localStorage.getItem(`btb_entries_${user}`);
  if (raw) {
    try {
      entries = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse user entries', e);
    }
  }

  // Update silhouette
  function updateSilhouette() {
    const imgEl = document.getElementById('profile-silhouette');
    const bmiEl = document.getElementById('profile-bmi');
    const statusEl = document.getElementById('profile-status');
    if (!imgEl) return;
    if (!entries.length) {
      imgEl.style.transform = 'scaleX(1)';
      imgEl.style.filter = 'brightness(1)';
      bmiEl.textContent = '–';
      statusEl.textContent = '–';
      return;
    }
    const last = entries[entries.length - 1];
    const bmi = computeBMI(last.weight, last.height);
    const category = bmiCategory(bmi);
    const base = 22;
    let factor = 1 + (bmi - base) / 40;
    if (factor < 0.75) factor = 0.75;
    if (factor > 1.5) factor = 1.5;
    const brightness = 0.5 + (last.muscle / 100);
    imgEl.style.transform = `scaleX(${factor.toFixed(2)})`;
    imgEl.style.filter = `brightness(${brightness.toFixed(2)})`;
    bmiEl.textContent = bmi.toFixed(1);
    statusEl.textContent = category;
  }

  // Update chart
  let chartInstance = null;
  let athleticChartInstance = null;
  let bmiChartInstance = null;
  function updateChart() {
    const canvas = document.getElementById('profile-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Sort entries by date
    const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(e => e.date);
    // Determine unit preference for this user (kg or lb)
    const unitKey = `btb_unit_${user}`;
    const unitPref = localStorage.getItem(unitKey) || 'kg';
    // Convert weights to selected unit for display
    const weightData = sorted.map(e => unitPref === 'lb' ? e.weight * 2.2046226218 : e.weight);
    const muscleData = sorted.map(e => e.muscle);
    const weightLabel = unitPref === 'lb' ? 'Weight (lb)' : 'Weight (kg)';
    const data = {
      labels: labels,
      datasets: [
        {
          label: weightLabel,
          data: weightData,
          borderColor: '#34e27c',
          backgroundColor: 'rgba(52, 226, 124, 0.2)',
          tension: 0.2,
          yAxisID: 'y',
        },
        {
          label: 'Muscle (%)',
          data: muscleData,
          borderColor: '#1ac0ff',
          backgroundColor: 'rgba(26, 192, 255, 0.2)',
          tension: 0.2,
          yAxisID: 'y1',
        },
      ],
    };
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: weightLabel,
              color: '#34e27c',
            },
            ticks: { color: '#34e27c' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Muscle (%)',
              color: '#1ac0ff',
            },
            ticks: { color: '#1ac0ff' },
            grid: { drawOnChartArea: false },
          },
          x: {
            ticks: { color: '#9aa8c7' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
        },
        plugins: {
          legend: { labels: { color: '#e5e9f0' } },
        },
      },
    };
    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = weightData;
      chartInstance.data.datasets[0].label = weightLabel;
      chartInstance.options.scales.y.title.text = weightLabel;
      chartInstance.data.datasets[1].data = muscleData;
      chartInstance.update();
    } else {
      chartInstance = new Chart(ctx, config);
    }
  }

  // Create or update BMI chart for public profile
  function updateBMIChart() {
    const canvas = document.getElementById('profile-bmi-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(e => e.date);
    const bmiData = sorted.map(e => computeBMI(e.weight, e.height));
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'BMI',
          data: bmiData,
          borderColor: '#ffda6a',
          backgroundColor: 'rgba(255, 218, 106, 0.2)',
          tension: 0.2,
        },
      ],
    };
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'BMI',
              color: '#ffda6a',
            },
            ticks: { color: '#ffda6a' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          x: {
            ticks: { color: '#9aa8c7' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
        },
        plugins: {
          legend: { labels: { color: '#e5e9f0' } },
        },
      },
    };
    if (bmiChartInstance) {
      bmiChartInstance.data.labels = labels;
      bmiChartInstance.data.datasets[0].data = bmiData;
      bmiChartInstance.update();
    } else {
      bmiChartInstance = new Chart(ctx, config);
    }
  }

  // Update or create athleticism chart for public profile
  function updateAthleticChart() {
    const canvas = document.getElementById('profile-athletic-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(e => e.date);
    const athleticData = sorted.map(e => {
      return computeAthleticism(e.weight, e.height, e.muscle);
    });
    const data = {
      labels: labels,
      datasets: [
        {
          label: 'Athleticism Score',
          data: athleticData,
          borderColor: '#e48bff',
          backgroundColor: 'rgba(228, 139, 255, 0.2)',
          tension: 0.2,
        },
      ],
    };
    const config = {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Athleticism Score',
              color: '#e48bff',
            },
            ticks: { color: '#e48bff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
          },
          x: {
            ticks: { color: '#9aa8c7' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
          },
        },
        plugins: {
          legend: { labels: { color: '#e5e9f0' } },
        },
      },
    };
    if (athleticChartInstance) {
      athleticChartInstance.data.labels = labels;
      athleticChartInstance.data.datasets[0].data = athleticData;
      athleticChartInstance.update();
    } else {
      athleticChartInstance = new Chart(ctx, config);
    }
  }

  updateSilhouette();
  updateChart();
  updateAthleticChart();
  updateBMIChart();
})();