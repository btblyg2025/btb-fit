// Public profile script - read-only view of btbga's fitness journey

const PUBLIC_USER = 'btbga';

let chartInstance = null;
let athleticChartInstance = null;
let bmiChartInstance = null;
let waterChartInstance = null;
let macrosChartInstance = null;
let userProfile = {
  displayName: ''
};
let privacySettings = {
  silhouette: true,
  bmi: true,
    progress: true,
    athleticism: true,
    water: true,
    macros: true,
    projections: true
  };// Load privacy settings
const privacyRaw = localStorage.getItem(`btb_privacy_${PUBLIC_USER}`);
if (privacyRaw) {
  try {
    privacySettings = JSON.parse(privacyRaw);
  } catch (e) {
    console.error('Failed to parse privacy settings', e);
  }
}

// Load user profile
const profileRaw = localStorage.getItem(`btb_profile_${PUBLIC_USER}`);
if (profileRaw) {
  try {
    userProfile = JSON.parse(profileRaw);
  } catch (e) {
    console.error('Failed to parse user profile', e);
  }
}

// Update header with user info
const profileUserEl = document.getElementById('profile-user');
if (profileUserEl) {
  const displayText = userProfile.displayName 
    ? `${userProfile.displayName}'s Fitness Journey` 
    : `Your Fitness Journey`;
  profileUserEl.textContent = displayText;
}

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

function computeAthleticism(weightKg, heightCm, musclePercent) {
  const bmi = computeBMI(weightKg, heightCm);
  return musclePercent - (bmi - 22);
}

// Load entries for public user
let entries = [];
const raw = localStorage.getItem(`btb_entries_${PUBLIC_USER}`);
if (raw) {
  try {
    entries = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse entries', e);
  }
}

// Apply privacy settings to DOM
function applyPrivacySettings() {
  const silhouetteCard = document.querySelector('.silhouette-card');
  const bmiCard = document.getElementById('bmi-card');
  const progressCard = document.getElementById('progress-card');
  const athleticCard = document.getElementById('athletic-card');
  const waterCard = document.getElementById('water-card');
  const macrosCard = document.getElementById('macros-card');
  const projectionsModule = document.getElementById('projections-module');
  
  if (silhouetteCard) silhouetteCard.style.display = privacySettings.silhouette ? 'block' : 'none';
  if (bmiCard) bmiCard.style.display = privacySettings.bmi ? 'block' : 'none';
  if (progressCard) progressCard.style.display = privacySettings.progress ? 'block' : 'none';
  if (athleticCard) athleticCard.style.display = privacySettings.athleticism ? 'block' : 'none';
  if (waterCard) waterCard.style.display = privacySettings.water ? 'block' : 'none';
  if (macrosCard) macrosCard.style.display = privacySettings.macros ? 'block' : 'none';
  if (projectionsModule) projectionsModule.style.display = privacySettings.projections ? 'block' : 'none';
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
  
  // Hydration status
  const hydrationEl = document.getElementById('profile-hydration');
  if (hydrationEl) {
    const water = last.water || 0;
    let hydrationStatus = '';
    let hydrationColor = '';
    if (water === 0) {
      hydrationStatus = 'No Data';
      hydrationColor = '#7c8aa9';
    } else if (water < 48) {
      hydrationStatus = 'Low 🟡';
      hydrationColor = '#ffa726';
    } else if (water < 64) {
      hydrationStatus = 'Fair 🟢';
      hydrationColor = '#66bb6a';
    } else if (water <= 100) {
      hydrationStatus = 'Good ✓';
      hydrationColor = '#34e27c';
    } else {
      hydrationStatus = 'High 🔵';
      hydrationColor = '#1ac0ff';
    }
    hydrationEl.textContent = hydrationStatus;
    hydrationEl.style.color = hydrationColor;
  }
  
  // Nutrition status
  const nutritionEl = document.getElementById('profile-nutrition');
  if (nutritionEl) {
    const protein = last.protein || 0;
    const carbs = last.carbs || 0;
    const fats = last.fats || 0;
    const totalCalories = (protein * 4) + (carbs * 4) + (fats * 9);
    
    let nutritionStatus = '';
    let nutritionColor = '';
    if (totalCalories === 0) {
      nutritionStatus = 'No Data';
      nutritionColor = '#7c8aa9';
    } else if (totalCalories < 1200) {
      nutritionStatus = 'Low 🟡';
      nutritionColor = '#ffa726';
    } else if (totalCalories < 1800) {
      nutritionStatus = 'Fair 🟢';
      nutritionColor = '#66bb6a';
    } else if (totalCalories <= 2500) {
      nutritionStatus = 'Good ✓';
      nutritionColor = '#34e27c';
    } else {
      nutritionStatus = 'High 🔵';
      nutritionColor = '#1ac0ff';
    }
    nutritionEl.textContent = nutritionStatus;
    nutritionEl.style.color = nutritionColor;
  }
}

// Update progress chart
function updateChart() {
  const canvas = document.getElementById('profile-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const unitPref = localStorage.getItem(`btb_unit_${PUBLIC_USER}`) || 'kg';
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
          title: { display: true, text: weightLabel, color: '#34e27c' },
          ticks: { color: '#34e27c' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Muscle (%)', color: '#1ac0ff' },
          ticks: { color: '#1ac0ff' },
          grid: { drawOnChartArea: false },
        },
        x: {
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      plugins: { legend: { labels: { color: '#e5e9f0' } } },
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

// Update BMI chart
function updateBMIChart() {
  const canvas = document.getElementById('profile-bmi-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const bmiData = sorted.map(e => computeBMI(e.weight, e.height));
  
  const data = {
    labels: labels,
    datasets: [{
      label: 'BMI',
      data: bmiData,
      borderColor: '#ffda6a',
      backgroundColor: 'rgba(255, 218, 106, 0.2)',
      tension: 0.2,
    }],
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'BMI', color: '#ffda6a' },
          ticks: { color: '#ffda6a' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        x: {
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      plugins: { legend: { labels: { color: '#e5e9f0' } } },
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

// Update athleticism chart
function updateAthleticChart() {
  const canvas = document.getElementById('profile-athletic-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const athleticData = sorted.map(e => computeAthleticism(e.weight, e.height, e.muscle));
  
  const data = {
    labels: labels,
    datasets: [{
      label: 'Athleticism Score',
      data: athleticData,
      borderColor: '#e48bff',
      backgroundColor: 'rgba(228, 139, 255, 0.2)',
      tension: 0.2,
    }],
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Athleticism Score', color: '#e48bff' },
          ticks: { color: '#e48bff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        x: {
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      plugins: { legend: { labels: { color: '#e5e9f0' } } },
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

// Update water chart
function updateWaterChart() {
  const canvas = document.getElementById('profile-water-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const waterData = sorted.map(e => e.water || 0);
  
  const data = {
    labels: labels,
    datasets: [{
      label: 'Water Intake (oz)',
      data: waterData,
      borderColor: '#1ac0ff',
      backgroundColor: 'rgba(26, 192, 255, 0.2)',
      tension: 0.2,
      fill: true,
    }],
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Water (oz)', color: '#1ac0ff' },
          ticks: { color: '#1ac0ff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: true,
        },
        x: {
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      plugins: { legend: { labels: { color: '#e5e9f0' } } },
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

// Update macros chart
function updateMacrosChart() {
  const canvas = document.getElementById('public-macros-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
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
          title: { display: true, text: 'Grams', color: '#9aa8c7' },
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: true,
        },
        x: {
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      plugins: { legend: { labels: { color: '#e5e9f0' } } },
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

// Calculate projections for public profile
function calculatePublicProjections() {
  if (entries.length < 2) return;
  
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestWeight = latest.weight;
  
  let weightLossRate = 0;
  if (sorted.length >= 7) {
    const recentDays = Math.min(30, sorted.length);
    const recentEntries = sorted.slice(-recentDays);
    const oldestRecent = recentEntries[0];
    const daysDiff = (new Date(latest.date) - new Date(oldestRecent.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      weightLossRate = (oldestRecent.weight - latestWeight) / daysDiff;
    }
  } else {
    const oldest = sorted[0];
    const daysDiff = (new Date(latest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      weightLossRate = (oldest.weight - latestWeight) / daysDiff;
    }
  }
  
  let nutritionFactor = 1.0;
  let hydrationFactor = 1.0;
  
  if (sorted.length >= 3) {
    const recentEntries = sorted.slice(-7);
    let totalCalories = 0;
    let totalWater = 0;
    let count = 0;
    
    recentEntries.forEach(entry => {
      const protein = entry.protein || 0;
      const carbs = entry.carbs || 0;
      const fats = entry.fats || 0;
      const calories = (protein * 4) + (carbs * 4) + (fats * 9);
      const water = entry.water || 0;
      
      totalCalories += calories;
      totalWater += water;
      count++;
    });
    
    const avgCalories = count > 0 ? totalCalories / count : 0;
    const avgWater = count > 0 ? totalWater / count : 0;
    
    if (avgCalories > 0) {
      if (avgCalories < 1500) nutritionFactor = 1.3;
      else if (avgCalories < 2000) nutritionFactor = 1.15;
      else if (avgCalories < 2500) nutritionFactor = 1.0;
      else nutritionFactor = 0.85;
    }
    
    if (avgWater >= 64) hydrationFactor = 1.1;
    else if (avgWater >= 48) hydrationFactor = 1.0;
    else if (avgWater > 0) hydrationFactor = 0.95;
  }
  
  const adjustedRate = weightLossRate * nutritionFactor * hydrationFactor;
  
  const periods = [7, 15, 30, 180];
  periods.forEach(days => {
    let projectedWeight = latestWeight - (adjustedRate * days);
    // Prevent negative or unrealistic weight (minimum 40 kg / 88 lb)
    if (projectedWeight < 40) projectedWeight = 40;
    const change = projectedWeight - latestWeight;
    
    const projectedLb = projectedWeight * 2.20462;
    const changeLb = change * 2.20462;
    
    const projEl = document.getElementById(`public-proj-${days}`);
    if (projEl) {
      projEl.textContent = `${projectedLb.toFixed(1)} lb`;
    }
    
    const changeEl = document.getElementById(`public-proj-change-${days}`);
    if (changeEl) {
      const changeText = changeLb >= 0 ? `+${changeLb.toFixed(1)} lb` : `${changeLb.toFixed(1)} lb`;
      changeEl.textContent = changeText;
      
      changeEl.classList.remove('positive', 'negative', 'neutral');
      if (changeLb < -1) changeEl.classList.add('positive');
      else if (changeLb > 1) changeEl.classList.add('negative');
      else changeEl.classList.add('neutral');
    }
  });
}

updateSilhouette();
updateChart();
updateAthleticChart();
updateBMIChart();
updateWaterChart();
updateMacrosChart();
calculatePublicProjections();
applyPrivacySettings();
