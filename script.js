// Main script for btb.fit

let currentUser = null;
let entries = [];
let chartInstance = null;
// Second chart instance for athleticism score
let athleticChartInstance = null;
// Chart instance for BMI over time
let bmiChartInstance = null;
// Chart instances for water and macros
let waterChartInstance = null;
let macrosChartInstance = null;

// Utility to format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

// Load entries for the current user from localStorage
function loadEntries() {
  if (!currentUser) return [];
  try {
    const raw = localStorage.getItem(`btb_entries_${currentUser}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load entries from localStorage:', e);
    alert('Error loading your data. Your browser may have storage restrictions enabled.');
    return [];
  }
}

// Save entries for current user
function saveEntries() {
  if (!currentUser) return;
  try {
    localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save entries to localStorage:', e);
    if (e.name === 'QuotaExceededError') {
      alert('Storage quota exceeded! Please delete some old entries or export your data.');
    } else {
      alert('Error saving your data. Your browser may have storage restrictions enabled.');
    }
  }
}

// Compute BMI given kg and cm
function computeBMI(weight, heightCm) {
  const heightMeters = heightCm / 100;
  return weight / (heightMeters * heightMeters);
}

// Compute a simple athleticism score based on muscle percentage and BMI.
// Higher muscle and lower BMI yields a higher score. The baseline BMI is 22.
function computeAthleticism(weightKg, heightCm, musclePercent) {
  const bmi = computeBMI(weightKg, heightCm);
  // Athleticism score formula: muscle percentage minus the deviation of BMI from 22
  return musclePercent - (bmi - 22);
}

// Compute BMI data for each entry and update the BMI chart
function updateBMIChart() {
  const canvas = document.getElementById('bmi-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Sort entries by date
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const bmiData = sorted.map(e => {
    return computeBMI(e.weight, e.height);
  });
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

// Determine BMI category
function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Create or update water intake chart
function updateWaterChart() {
  const canvas = document.getElementById('water-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Sort entries by date
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const waterData = sorted.map(e => e.water || 0);
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Water Intake (oz)',
        data: waterData,
        borderColor: '#1ac0ff',
        backgroundColor: 'rgba(26, 192, 255, 0.2)',
        tension: 0.2,
        fill: true,
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
            text: 'Water (oz)',
            color: '#1ac0ff',
          },
          ticks: { color: '#1ac0ff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: true,
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
  if (waterChartInstance) {
    waterChartInstance.data.labels = labels;
    waterChartInstance.data.datasets[0].data = waterData;
    waterChartInstance.update();
  } else {
    waterChartInstance = new Chart(ctx, config);
  }
}

// Create or update macros chart
function updateMacrosChart() {
  const canvas = document.getElementById('macros-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Sort entries by date
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const proteinData = sorted.map(e => e.protein || 0);
  const carbsData = sorted.map(e => e.carbs || 0);
  const fatsData = sorted.map(e => e.fats || 0);
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Protein (g)',
        data: proteinData,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        tension: 0.2,
      },
      {
        label: 'Carbs (g)',
        data: carbsData,
        borderColor: '#ffda6a',
        backgroundColor: 'rgba(255, 218, 106, 0.2)',
        tension: 0.2,
      },
      {
        label: 'Fats (g)',
        data: fatsData,
        borderColor: '#34e27c',
        backgroundColor: 'rgba(52, 226, 124, 0.2)',
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
            text: 'Grams',
            color: '#9aa8c7',
          },
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: true,
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
  if (macrosChartInstance) {
    macrosChartInstance.data.labels = labels;
    macrosChartInstance.data.datasets[0].data = proteinData;
    macrosChartInstance.data.datasets[1].data = carbsData;
    macrosChartInstance.data.datasets[2].data = fatsData;
    macrosChartInstance.update();
  } else {
    macrosChartInstance = new Chart(ctx, config);
  }
}

// Update the silhouette appearance and info based on the latest entry
function updateSilhouette() {
  // Use the image element for the silhouette
  const silhouetteEl = document.getElementById('silhouette-img');
  const bmiValueEl = document.getElementById('bmi-value');
  const statusEl = document.getElementById('status-value');

  if (!silhouetteEl) return;
  if (!entries.length) {
    silhouetteEl.style.transform = 'scaleX(1)';
    // Default brightness for black silhouette
    silhouetteEl.style.filter = 'brightness(1)';
    bmiValueEl.textContent = '–';
    statusEl.textContent = '–';
    return;
  }

  // Use the most recent entry for silhouette
  const last = entries[entries.length - 1];
  const bmi = computeBMI(last.weight, last.height);
  const category = bmiCategory(bmi);
  // Calculate width factor: base at BMI 22 as 1. Range 0.75 to 1.5
  const base = 22;
  let factor = 1 + (bmi - base) / 40;
  if (factor < 0.75) factor = 0.75;
  if (factor > 1.5) factor = 1.5;
  // Adjust brightness based on muscle mass: more muscle = brighter silhouette
  const brightness = 0.5 + (last.muscle / 100);
    silhouetteEl.style.transform = `scaleX(${factor.toFixed(2)})`;
    silhouetteEl.style.filter = `brightness(${brightness.toFixed(2)})`;
  bmiValueEl.textContent = bmi.toFixed(1);
  statusEl.textContent = category;
}

// Update Chart.js graph with current entries
function updateChart() {
  const ctx = document.getElementById('progress-chart').getContext('2d');
  // Prepare data: sort entries by date
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  // Determine the selected unit for weight (kg or lb)
  const unitSelectEl = document.getElementById('unit-select');
  const unit = unitSelectEl ? unitSelectEl.value : 'kg';
  // Convert stored weight (kg) to desired unit for display
  const weightData = sorted.map(e => {
    return unit === 'lb' ? e.weight * 2.2046226218 : e.weight;
  });
  const muscleData = sorted.map(e => e.muscle);
  const weightLabel = unit === 'lb' ? 'Weight (lb)' : 'Weight (kg)';
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
          ticks: {
            color: '#34e27c',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Muscle (%)',
            color: '#1ac0ff',
          },
          ticks: {
            color: '#1ac0ff',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
        x: {
          ticks: {
            color: '#9aa8c7',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#e5e9f0',
          },
        },
      },
    },
  };
  if (chartInstance) {
    // Update labels and data
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

// Create or update the athleticism score chart
function updateAthleticChart() {
  const canvas = document.getElementById('athletic-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Prepare and sort data by date
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
          ticks: {
            color: '#e48bff',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
        },
        x: {
          ticks: {
            color: '#9aa8c7',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#e5e9f0',
          },
        },
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

// Initialize application after login
function initApp(username) {
  currentUser = username;
  // Hide login overlay completely by setting display none
  // Hide login modal
  const modalEl = document.getElementById('login-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.style.display = 'none';
  }
  const appEl = document.getElementById('app');
  appEl.classList.remove('hidden');
  document.getElementById('welcome-message').textContent = `Hello, ${username}`;
  
  // Update privacy toggle button
  const isPublic = localStorage.getItem(`btb_profile_public_${username}`) !== 'false';
  const privacyBtn = document.getElementById('privacy-toggle-btn');
  if (privacyBtn) {
    privacyBtn.textContent = isPublic ? 'Profile: Public' : 'Profile: Private';
  }
  
  entries = loadEntries();
  // Load unit preference for this user and apply to the unit selector
  const unitKey = `btb_unit_${username}`;
  const savedUnit = localStorage.getItem(unitKey);
  const unitSelectEl = document.getElementById('unit-select');
  if (unitSelectEl) {
    unitSelectEl.value = savedUnit || 'kg';
  }
  // Set date input default to today
  const todayStr = formatDate(new Date());
  document.getElementById('date-input').value = todayStr;
  // Populate chart and silhouette
  updateChart();
  updateSilhouette();
  updateAthleticChart();
  updateBMIChart();
  updateWaterChart();
  updateMacrosChart();
}

// Show login overlay and hide app
function showLogin() {
  document.getElementById('app').classList.add('hidden');
  const modalEl = document.getElementById('login-modal');
  if (modalEl) {
    modalEl.classList.remove('hidden');
    modalEl.style.display = 'flex';
  }
}

// On DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if Chart.js loaded successfully
  if (typeof Chart === 'undefined') {
    alert('Failed to load Chart.js library. Charts will not be displayed. Please check your internet connection.');
  }
  
  const storedUser = localStorage.getItem('btb_username');
  if (storedUser) {
    initApp(storedUser);
  } else {
    showLogin();
  }

  // Login form handler
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username-input').value.trim();
    if (username) {
      localStorage.setItem('btb_username', username);
      initApp(username);
    }
  });

  // Logout button handler
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('btb_username');
    currentUser = null;
    showLogin();
  });

  // Privacy toggle button handler
  document.getElementById('privacy-toggle-btn').addEventListener('click', () => {
    if (!currentUser) return;
    const currentStatus = localStorage.getItem(`btb_profile_public_${currentUser}`) !== 'false';
    const newStatus = !currentStatus;
    localStorage.setItem(`btb_profile_public_${currentUser}`, newStatus.toString());
    const privacyBtn = document.getElementById('privacy-toggle-btn');
    privacyBtn.textContent = newStatus ? 'Profile: Public' : 'Profile: Private';
    alert(`Your profile is now ${newStatus ? 'public' : 'private'}`);
  });

  // Export data button handler
  document.getElementById('export-btn').addEventListener('click', () => {
    if (!currentUser || entries.length === 0) {
      alert('No data to export!');
      return;
    }
    const dataToExport = {
      username: currentUser,
      exportDate: new Date().toISOString(),
      entries: entries
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `btb_fit_${currentUser}_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Data exported successfully!');
  });

  // Import data button handler
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  // File input handler for import
  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!importedData.entries || !Array.isArray(importedData.entries)) {
          alert('Invalid data format!');
          return;
        }
        if (confirm(`Import ${importedData.entries.length} entries? This will replace your current data.`)) {
          entries = importedData.entries;
          saveEntries();
          updateChart();
          updateSilhouette();
          updateAthleticChart();
          updateBMIChart();
          updateWaterChart();
          updateMacrosChart();
          alert('Data imported successfully!');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check the file format.');
      }
      // Reset file input
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // Entry form handler
  document.getElementById('entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // Collect values
    const date = document.getElementById('date-input').value;
    let weight = parseFloat(document.getElementById('weight-input').value);
    const height = parseFloat(document.getElementById('height-input').value);
    const muscle = parseFloat(document.getElementById('muscle-input').value);
    const water = parseFloat(document.getElementById('water-input').value) || 0;
    const protein = parseFloat(document.getElementById('protein-input').value) || 0;
    const carbs = parseFloat(document.getElementById('carbs-input').value) || 0;
    const fats = parseFloat(document.getElementById('fats-input').value) || 0;
    
    if (!date || isNaN(weight) || isNaN(height) || isNaN(muscle)) {
      return;
    }
    
    // Validate input ranges
    const unitVal = document.getElementById('unit-select') ? document.getElementById('unit-select').value : 'kg';
    const minWeight = unitVal === 'lb' ? 44 : 20;
    const maxWeight = unitVal === 'lb' ? 1100 : 500;
    
    if (weight < minWeight || weight > maxWeight) {
      alert(`Weight must be between ${minWeight} and ${maxWeight} ${unitVal}`);
      return;
    }
    if (height < 50 || height > 300) {
      alert('Height must be between 50 and 300 cm');
      return;
    }
    if (muscle < 5 || muscle > 70) {
      alert('Muscle percentage must be between 5% and 70%');
      return;
    }
    
    // Convert weight to kilograms if user selected pounds
    if (unitVal === 'lb') {
      weight = weight * 0.45359237;
    }
    
    // Check for existing entry on this date
    const existingEntry = entries.find(e => e.date === date);
    if (existingEntry) {
      if (!confirm(`You already have an entry for ${date}. Do you want to replace it?`)) {
        return;
      }
    }
    
    // Check maximum entry limit (365 entries = 1 year)
    if (entries.length >= 365 && !existingEntry) {
      alert('You have reached the maximum of 365 entries. Please delete some old entries first.');
      return;
    }
    
    // Create entry with new fields
    const newEntry = { date, weight, height, muscle, water, protein, carbs, fats };
    // Remove existing entry for same date if exists
    entries = entries.filter(e => e.date !== date);
    entries.push(newEntry);
    // Save and update
    saveEntries();
    updateChart();
    updateSilhouette();
    updateAthleticChart();
    updateBMIChart();
    updateWaterChart();
    updateMacrosChart();
    // Clear inputs for convenience (except date and height which usually stay the same)
    document.getElementById('weight-input').value = '';
    document.getElementById('muscle-input').value = '';
    document.getElementById('water-input').value = '';
    document.getElementById('protein-input').value = '';
    document.getElementById('carbs-input').value = '';
    document.getElementById('fats-input').value = '';
  });

  // Unit selector change handler
  const unitSelector = document.getElementById('unit-select');
  if (unitSelector) {
    unitSelector.addEventListener('change', (e) => {
      const selectedUnit = e.target.value;
      // Persist unit preference per user
      if (currentUser) {
        localStorage.setItem(`btb_unit_${currentUser}`, selectedUnit);
      }
      // Clear weight input to avoid confusion when switching units
      const weightInput = document.getElementById('weight-input');
      if (weightInput && weightInput.value) {
        if (confirm('Unit changed. Clear the weight field to avoid confusion?')) {
          weightInput.value = '';
        }
      }
      // Update placeholder to show current unit
      if (weightInput) {
        weightInput.placeholder = selectedUnit === 'lb' ? 'e.g. 165' : 'e.g. 75';
      }
      // Refresh charts to reflect new unit
      updateChart();
      updateAthleticChart();
      updateBMIChart();
      updateWaterChart();
      updateMacrosChart();
    });
  }
});