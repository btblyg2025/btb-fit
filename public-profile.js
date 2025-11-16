// Public profile script - read-only view of btbga's fitness journey

const PUBLIC_USER = 'btbga';

// State management
const state = {
  charts: {
    progress: null,
    athletic: null,
    bmi: null,
    water: null,
    macros: null,
    bodyComp: null
  },
  userProfile: { displayName: '' },
  privacySettings: {
    silhouette: true,
    bmi: true,
    progress: true,
    athleticism: true,
    water: true,
    macros: true,
    bodyComp: true,
    projections: true
  },
  entries: []
};

// Utility functions
const utils = {
  getFromStorage: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Failed to parse ${key}:`, e);
      return defaultValue;
    }
  },
  
  computeBMI: (weight, heightCm) => {
    const heightMeters = heightCm / 100;
    return weight / (heightMeters * heightMeters);
  },
  
  bmiCategory: (bmi) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  },
  
  computeAthleticism: (weightKg, heightCm, musclePercent) => {
    if (!musclePercent || isNaN(musclePercent)) return null;
    const bmi = utils.computeBMI(weightKg, heightCm);
    return musclePercent - (bmi - 22);
  },
  
  sortByDate: (entries) => {
    return [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  },
  
  getStatusConfig: (value, thresholds) => {
    for (const threshold of thresholds) {
      if (threshold.condition(value)) {
        return { text: threshold.text, class: threshold.class, color: threshold.color };
      }
    }
    return thresholds[thresholds.length - 1];
  }
};

// Load initial data
state.privacySettings = utils.getFromStorage(`btb_privacy_${PUBLIC_USER}`, state.privacySettings);
state.userProfile = utils.getFromStorage(`btb_profile_${PUBLIC_USER}`, state.userProfile);
state.entries = utils.getFromStorage(`btb_entries_${PUBLIC_USER}`, []);

// Initialize header
const initHeader = () => {
  const profileUserEl = document.getElementById('profile-user');
  if (profileUserEl) {
    const displayText = state.userProfile.displayName 
      ? `${state.userProfile.displayName}'s Fitness Journey` 
      : 'Your Fitness Journey';
    profileUserEl.textContent = displayText;
  }
};

// Privacy management
const privacy = {
  cardConfigs: [
    { id: 'silhouette', selector: '.silhouette-card', key: 'silhouette' },
    { id: 'bmi', selector: '#bmi-card', key: 'bmi' },
    { id: 'progress', selector: '#progress-card', key: 'progress' },
    { id: 'athletic', selector: '#athletic-card', key: 'athleticism' },
    { id: 'water', selector: '#water-card', key: 'water' },
    { id: 'macros', selector: '#macros-card', key: 'macros' },
    { id: 'bodyComp', selector: '#body-comp-card', key: 'bodyComp' },
    { id: 'projections', selector: '#projections-module', key: 'projections' }
  ],
  
  apply: () => {
    console.log('Applying privacy settings:', state.privacySettings);
    
    privacy.cardConfigs.forEach(({ selector, key }) => {
      const element = document.querySelector(selector);
      const isVisible = state.privacySettings[key];
      console.log(`Privacy check - Selector: ${selector}, Key: ${key}, Element found: ${!!element}, IsVisible: ${isVisible}, Display will be: ${isVisible ? 'block' : 'none'}`);
      if (element) {
        element.style.display = isVisible ? 'block' : 'none';
      }
    });
    
    console.log('Privacy settings applied');
  }
};

// Silhouette update
const silhouette = {
  update: () => {
    if (!state.entries.length) {
      silhouette.clearDisplay();
      return;
    }
    
    const latest = state.entries[state.entries.length - 1];
    const { weight = 0, muscle = 0, musclePercent = muscle, bodyFat = 0, water = 0, carbs = 0, protein = 0, fats = 0, height = 175 } = latest;
    
    silhouette.updateMetrics(weight, musclePercent, bodyFat, water, carbs, protein, fats, height);
  },
  
  clearDisplay: () => {
    const imgEl = document.getElementById('profile-silhouette');
    const bmiEl = document.getElementById('profile-bmi');
    const statusEl = document.getElementById('profile-status');
    
    if (imgEl) {
      imgEl.style.transform = 'scaleX(1)';
      imgEl.style.filter = 'brightness(1)';
    }
    if (bmiEl) bmiEl.textContent = '–';
    if (statusEl) statusEl.textContent = '–';
  },
  
  updateMetrics: (weight, musclePercent, bodyFat, water, carbs, protein, fats, height) => {
    const bmi = utils.computeBMI(weight, height);
    const category = utils.bmiCategory(bmi);
    
    silhouette.updateBMI(bmi, category, musclePercent);
    silhouette.updateHydration(water);
    silhouette.updateNutrition(carbs, protein, fats);
  },
  
  updateBMI: (bmi, category, musclePercent) => {
    const imgEl = document.getElementById('profile-silhouette');
    const bmiEl = document.getElementById('profile-bmi');
    const statusEl = document.getElementById('profile-status');
    
    if (imgEl) {
      const base = 22;
      let factor = 1 + (bmi - base) / 40;
      factor = Math.max(0.75, Math.min(1.5, factor));
      
      const muscleBrightness = (musclePercent && !isNaN(musclePercent)) ? (0.5 + (musclePercent / 100)) : 1;
      
      imgEl.style.transform = `scaleX(${factor.toFixed(2)})`;
      imgEl.style.filter = `brightness(${muscleBrightness.toFixed(2)})`;
    }
    
    if (bmiEl) bmiEl.textContent = bmi.toFixed(1);
    if (statusEl) statusEl.textContent = category;
  },
  
  updateHydration: (water) => {
    const hydrationEl = document.getElementById('profile-hydration');
    if (!hydrationEl) return;
    
    const thresholds = [
      { condition: (w) => w === 0, text: 'No Data', class: '', color: '#7c8aa9' },
      { condition: (w) => w < 48, text: 'Low 🟡', class: '', color: '#ffa726' },
      { condition: (w) => w < 64, text: 'Fair 🟢', class: '', color: '#66bb6a' },
      { condition: (w) => w <= 100, text: 'Good ✓', class: '', color: '#34e27c' },
      { condition: () => true, text: 'High 🔵', class: '', color: '#1ac0ff' }
    ];
    
    const status = utils.getStatusConfig(water, thresholds);
    hydrationEl.textContent = status.text;
    hydrationEl.style.color = status.color;
  },
  
  updateNutrition: (carbs, protein, fats) => {
    const nutritionEl = document.getElementById('profile-nutrition');
    if (!nutritionEl) return;
    
    const totalCalories = (protein * 4) + (carbs * 4) + (fats * 9);
    
    const thresholds = [
      { condition: (cal) => cal === 0, text: 'No Data', class: '', color: '#7c8aa9' },
      { condition: (cal) => cal < 1200, text: 'Low 🟡', class: '', color: '#ffa726' },
      { condition: (cal) => cal < 1800, text: 'Fair 🟢', class: '', color: '#66bb6a' },
      { condition: (cal) => cal <= 2500, text: 'Good ✓', class: '', color: '#34e27c' },
      { condition: () => true, text: 'High 🔵', class: '', color: '#1ac0ff' }
    ];
    
    const status = utils.getStatusConfig(totalCalories, thresholds);
    nutritionEl.textContent = status.text;
    nutritionEl.style.color = status.color;
  }
};

// Chart factory
const chartFactory = {
  defaultOptions: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#e5e9f0' } } }
  },
  
  createOrUpdate: (chartKey, canvasId, type, datasets, scalesConfig) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const sorted = utils.sortByDate(state.entries);
    const labels = sorted.map(e => e.date);
    
    const config = {
      type,
      data: { labels, datasets },
      options: {
        ...chartFactory.defaultOptions,
        scales: chartFactory.buildScales(scalesConfig)
      }
    };
    
    if (state.charts[chartKey]) {
      state.charts[chartKey].data.labels = labels;
      state.charts[chartKey].data.datasets = datasets;
      state.charts[chartKey].update();
    } else {
      const ctx = canvas.getContext('2d');
      state.charts[chartKey] = new Chart(ctx, config);
    }
  },
  
  buildScales: (config) => {
    const scales = {
      x: {
        ticks: { color: '#9aa8c7' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    };
    
    if (config.y) {
      scales.y = {
        title: { display: true, text: config.y.title, color: config.y.color || '#9aa8c7' },
        ticks: { color: config.y.color || '#9aa8c7' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: config.y.beginAtZero || false,
        ...config.y.extra
      };
    }
    
    if (config.y1) {
      scales.y1 = {
        type: 'linear',
        position: 'right',
        title: { display: true, text: config.y1.title, color: config.y1.color },
        ticks: { color: config.y1.color },
        grid: { drawOnChartArea: false }
      };
    }
    
    return scales;
  }
};

// Chart updates
const charts = {
  updateProgress: () => {
    const sorted = utils.sortByDate(state.entries);
    const unitPref = localStorage.getItem(`btb_unit_${PUBLIC_USER}`) || 'kg';
    const weightLabel = unitPref === 'lb' ? 'Weight (lb)' : 'Weight (kg)';
    const weightData = sorted.map(e => unitPref === 'lb' ? e.weight * 2.2046226218 : e.weight);
    const muscleData = sorted.map(e => e.muscle || e.musclePercent);
    
    const datasets = [
      {
        label: weightLabel,
        data: weightData,
        borderColor: '#34e27c',
        backgroundColor: 'rgba(52, 226, 124, 0.2)',
        tension: 0.2,
        yAxisID: 'y'
      },
      {
        label: 'Muscle (%)',
        data: muscleData,
        borderColor: '#1ac0ff',
        backgroundColor: 'rgba(26, 192, 255, 0.2)',
        tension: 0.2,
        yAxisID: 'y1'
      }
    ];
    
    chartFactory.createOrUpdate('progress', 'profile-chart', 'line', datasets, {
      y: { title: weightLabel, color: '#34e27c' },
      y1: { title: 'Muscle (%)', color: '#1ac0ff' }
    });
  },
  
  updateBMI: () => {
    const sorted = utils.sortByDate(state.entries);
    const bmiData = sorted.map(e => utils.computeBMI(e.weight, e.height));
    
    const datasets = [{
      label: 'BMI',
      data: bmiData,
      borderColor: '#ffda6a',
      backgroundColor: 'rgba(255, 218, 106, 0.2)',
      tension: 0.2
    }];
    
    chartFactory.createOrUpdate('bmi', 'profile-bmi-chart', 'line', datasets, {
      y: { title: 'BMI', color: '#ffda6a' }
    });
  },
  
  updateAthletic: () => {
    const sorted = utils.sortByDate(state.entries);
    const athleticData = sorted.map(e => utils.computeAthleticism(e.weight, e.height, e.muscle || e.musclePercent));
    
    const datasets = [{
      label: 'Athleticism Score',
      data: athleticData,
      borderColor: '#e48bff',
      backgroundColor: 'rgba(228, 139, 255, 0.2)',
      tension: 0.2,
      spanGaps: true
    }];
    
    chartFactory.createOrUpdate('athletic', 'profile-athletic-chart', 'line', datasets, {
      y: { title: 'Athleticism Score', color: '#e48bff' }
    });
  },
  
  updateWater: () => {
    const sorted = utils.sortByDate(state.entries);
    const waterData = sorted.map(e => e.water || 0);
    
    const datasets = [{
      label: 'Water Intake (oz)',
      data: waterData,
      borderColor: '#1ac0ff',
      backgroundColor: 'rgba(26, 192, 255, 0.2)',
      tension: 0.2,
      fill: true
    }];
    
    chartFactory.createOrUpdate('water', 'profile-water-chart', 'line', datasets, {
      y: { title: 'Water (oz)', color: '#1ac0ff', beginAtZero: true }
    });
  },
  
  updateMacros: () => {
    const sorted = utils.sortByDate(state.entries);
    const proteinData = sorted.map(e => e.protein || 0);
    const carbsData = sorted.map(e => e.carbs || 0);
    const fatsData = sorted.map(e => e.fats || 0);
    
    const datasets = [
      {
        label: 'Protein (g)',
        data: proteinData,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        tension: 0.2
      },
      {
        label: 'Carbs (g)',
        data: carbsData,
        borderColor: '#ffda6a',
        backgroundColor: 'rgba(255, 218, 106, 0.2)',
        tension: 0.2
      },
      {
        label: 'Fats (g)',
        data: fatsData,
        borderColor: '#34e27c',
        backgroundColor: 'rgba(52, 226, 124, 0.2)',
        tension: 0.2
      }
    ];
    
    chartFactory.createOrUpdate('macros', 'public-macros-chart', 'line', datasets, {
      y: { title: 'Grams', color: '#9aa8c7', beginAtZero: true }
    });
  },
  
  updateBodyComp: () => {
    const sorted = utils.sortByDate(state.entries);
    const entriesWithData = sorted.filter(e => 
      !isNaN(e.muscle) || !isNaN(e.musclePercent) || !isNaN(e.bodyFat) || !isNaN(e.bodyWater) || !isNaN(e.boneMass)
    );
    
    if (entriesWithData.length === 0) {
      if (state.charts.bodyComp) {
        state.charts.bodyComp.destroy();
        state.charts.bodyComp = null;
      }
      return;
    }
    
    const canvas = document.getElementById('public-body-comp-chart');
    if (!canvas) return;
    
    const labels = entriesWithData.map(e => e.date);
    const muscleData = entriesWithData.map(e => e.muscle || e.musclePercent || null);
    const bodyFatData = entriesWithData.map(e => e.bodyFat || null);
    const bodyWaterData = entriesWithData.map(e => e.bodyWater || null);
    
    const datasets = [];
    
    if (muscleData.some(v => v !== null)) {
      datasets.push({
        label: 'Muscle %',
        data: muscleData,
        borderColor: '#34e27c',
        backgroundColor: 'rgba(52, 226, 124, 0.2)',
        tension: 0.2,
        spanGaps: true
      });
    }
    
    if (bodyFatData.some(v => v !== null)) {
      datasets.push({
        label: 'Body Fat %',
        data: bodyFatData,
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.2)',
        tension: 0.2,
        spanGaps: true
      });
    }
    
    if (bodyWaterData.some(v => v !== null)) {
      datasets.push({
        label: 'Body Water %',
        data: bodyWaterData,
        borderColor: '#1ac0ff',
        backgroundColor: 'rgba(26, 192, 255, 0.2)',
        tension: 0.2,
        spanGaps: true
      });
    }
    
    const config = {
      type: 'line',
      data: { labels, datasets },
      options: {
        ...chartFactory.defaultOptions,
        scales: {
          y: {
            title: { display: true, text: 'Percentage (%)', color: '#9aa8c7' },
            ticks: { color: '#9aa8c7' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            min: 0,
            max: 100
          },
          x: {
            ticks: { color: '#9aa8c7' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    };
    
    if (state.charts.bodyComp) {
      state.charts.bodyComp.data.labels = labels;
      state.charts.bodyComp.data.datasets = datasets;
      state.charts.bodyComp.update();
    } else {
      const ctx = canvas.getContext('2d');
      state.charts.bodyComp = new Chart(ctx, config);
    }
  }
};

// Projections calculation
const projections = {
  calculate: () => {
    if (state.entries.length < 2) return;
    
    const sorted = utils.sortByDate(state.entries);
    const latest = sorted[sorted.length - 1];
    const latestWeight = latest.weight;
    
    const weightLossRate = projections.calculateWeightLossRate(sorted, latest, latestWeight);
    const { nutritionFactor, hydrationFactor } = projections.calculateAdjustmentFactors(sorted);
    const adjustedRate = weightLossRate * nutritionFactor * hydrationFactor;
    
    const periods = [7, 15, 30, 180];
    periods.forEach(days => projections.displayProjection(days, latestWeight, adjustedRate));
  },
  
  calculateWeightLossRate: (sorted, latest, latestWeight) => {
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
    
    return weightLossRate;
  },
  
  calculateAdjustmentFactors: (sorted) => {
    let nutritionFactor = 1.0;
    let hydrationFactor = 1.0;
    
    if (sorted.length < 3) return { nutritionFactor, hydrationFactor };
    
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
    
    return { nutritionFactor, hydrationFactor };
  },
  
  displayProjection: (days, latestWeight, adjustedRate) => {
    let projectedWeight = latestWeight - (adjustedRate * days);
    if (projectedWeight < 40) projectedWeight = 40;
    
    const change = projectedWeight - latestWeight;
    const projectedLb = projectedWeight * 2.20462;
    const changeLb = change * 2.20462;
    
    const projEl = document.getElementById(`public-proj-${days}`);
    if (projEl) projEl.textContent = `${projectedLb.toFixed(1)} lb`;
    
    const changeEl = document.getElementById(`public-proj-change-${days}`);
    if (changeEl) {
      const changeText = changeLb >= 0 ? `+${changeLb.toFixed(1)} lb` : `${changeLb.toFixed(1)} lb`;
      changeEl.textContent = changeText;
      
      changeEl.classList.remove('positive', 'negative', 'neutral');
      if (changeLb < -1) changeEl.classList.add('positive');
      else if (changeLb > 1) changeEl.classList.add('negative');
      else changeEl.classList.add('neutral');
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  silhouette.update();
  charts.updateProgress();
  charts.updateAthletic();
  charts.updateBMI();
  charts.updateWater();
  charts.updateMacros();
  charts.updateBodyComp();
  projections.calculate();
  privacy.apply();
  
  const adminLink = document.getElementById('secret-admin-link');
  if (adminLink) {
    adminLink.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }
});
