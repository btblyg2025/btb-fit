// Admin script for btb.fit - Password protected data entry

const ADMIN_USER = 'btbga'; // Your username

let currentUser = ADMIN_USER;
let entries = [];
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
  bodyComp: true,
  projections: true
};
let chartInstance = null;
let athleticChartInstance = null;
let bmiChartInstance = null;
let waterChartInstance = null;
let macrosChartInstance = null;
let bodyCompChartInstance = null;
let isAuthenticated = false;

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

// Calculate calories burned from workout
function calculateWorkoutCalories(workoutType, duration, intensity, weightKg) {
  // MET values (Metabolic Equivalent of Task)
  const metValues = {
    // Cardio - base values for moderate intensity
    running: { light: 6, moderate: 9.8, vigorous: 11.5, intense: 14 },
    cycling: { light: 4, moderate: 8, vigorous: 10, intense: 12 },
    swimming: { light: 6, moderate: 8, vigorous: 10, intense: 11 },
    walking: { light: 3.5, moderate: 4.5, vigorous: 5.5, intense: 6.5 },
    rowing: { light: 4.8, moderate: 7, vigorous: 8.5, intense: 12 },
    elliptical: { light: 4.5, moderate: 7, vigorous: 8, intense: 9.5 },
    stairmaster: { light: 5, moderate: 8, vigorous: 9, intense: 11 },
    // Strength Training
    weightlifting: { light: 3, moderate: 5, vigorous: 6, intense: 8 },
    bodyweight: { light: 3.5, moderate: 4.5, vigorous: 5.5, intense: 7 },
    crossfit: { light: 5, moderate: 8, vigorous: 10, intense: 12 },
    powerlifting: { light: 4, moderate: 6, vigorous: 8, intense: 10 },
    // Sports
    basketball: { light: 4.5, moderate: 6.5, vigorous: 8, intense: 10 },
    soccer: { light: 5, moderate: 7, vigorous: 10, intense: 12 },
    tennis: { light: 5, moderate: 7, vigorous: 8, intense: 9 },
    boxing: { light: 6, moderate: 9, vigorous: 12, intense: 14 },
    mma: { light: 6, moderate: 10, vigorous: 13, intense: 15 },
    yoga: { light: 2.5, moderate: 3, vigorous: 4, intense: 5 },
    pilates: { light: 3, moderate: 4, vigorous: 5, intense: 6 }
  };
  
  const met = metValues[workoutType]?.[intensity] || 5;
  // Calories = MET × weight(kg) × duration(hours)
  const caloriesBurned = met * weightKg * (duration / 60);
  return Math.round(caloriesBurned);
}

// Save entries for current user
function saveEntries() {
  if (!currentUser) return;
  try {
    localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(entries));
    // Sync to cloud in background (non-blocking)
    syncToCloud('entries', entries);
  } catch (e) {
    console.error('Failed to save entries to localStorage:', e);
    if (e.name === 'QuotaExceededError') {
      alert('Storage quota exceeded! Please delete some old entries or export your data.');
    } else {
      alert('Error saving your data. Your browser may have storage restrictions enabled.');
    }
  }
}

// Sync data to Netlify Blobs
async function syncToCloud(dataType, data) {
  const token = sessionStorage.getItem('btb_auth_token');
  if (!token) return; // Not authenticated, skip cloud sync
  
  try {
    const response = await fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, dataType, data })
    });
    
    if (response.ok) {
      console.log(`✓ ${dataType} synced to cloud`);
      // Update last sync indicator
      localStorage.setItem(`btb_last_sync_${dataType}`, new Date().toISOString());
    }
  } catch (error) {
    console.warn('Cloud sync failed (offline?):', error);
    // Silent fail - localStorage is still working
  }
}

// Load data from cloud and merge with local
async function loadFromCloud(dataType) {
  const token = sessionStorage.getItem('btb_auth_token');
  if (!token) return null;
  
  try {
    const response = await fetch('/api/load-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, dataType })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log(`✓ ${dataType} loaded from cloud`);
        return result.data;
      }
    }
  } catch (error) {
    console.warn('Cloud load failed:', error);
  }
  return null;
}

// Merge local and cloud data (cloud takes precedence if newer)
function mergeData(localData, cloudData, dataType) {
  if (!cloudData) return localData;
  if (!localData || localData.length === 0) return cloudData;
  
  if (dataType === 'entries') {
    // Merge entries by date, cloud wins on conflicts
    const merged = [...localData];
    const localDates = new Set(localData.map(e => e.date));
    
    cloudData.forEach(cloudEntry => {
      const existingIndex = merged.findIndex(e => e.date === cloudEntry.date);
      if (existingIndex >= 0) {
        // Replace with cloud version (assumed newer)
        merged[existingIndex] = cloudEntry;
      } else {
        // Add new entry from cloud
        merged.push(cloudEntry);
      }
    });
    
    return merged;
  }
  
  // For other data types (baseline, profile), cloud takes precedence
  return cloudData;
}

// Calculate weight projections based on trends
function calculateProjections() {
  const entries = loadEntries();
  if (entries.length < 2) return; // Need at least 2 data points
  
  // Sort by date
  const sorted = entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const latestWeight = latest.weight;
  
  // Calculate weight loss rate (kg per day) from trend
  let weightLossRate = 0;
  if (sorted.length >= 7) {
    // Use last 30 days or all data if less
    const recentDays = Math.min(30, sorted.length);
    const recentEntries = sorted.slice(-recentDays);
    const oldestRecent = recentEntries[0];
    const daysDiff = (new Date(latest.date) - new Date(oldestRecent.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      weightLossRate = (oldestRecent.weight - latestWeight) / daysDiff;
    }
  } else {
    // Simple calculation for limited data
    const oldest = sorted[0];
    const daysDiff = (new Date(latest.date) - new Date(oldest.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      weightLossRate = (oldest.weight - latestWeight) / daysDiff;
    }
  }
  
  // Calculate average nutrition (calories) and hydration factors
  let nutritionFactor = 1.0;
  let hydrationFactor = 1.0;
  let workoutFactor = 1.0;
  
  if (sorted.length >= 3) {
    const recentEntries = sorted.slice(-7); // Last week or available
    let totalCalories = 0;
    let totalWater = 0;
    let totalWorkoutCalories = 0;
    let count = 0;
    
    recentEntries.forEach(entry => {
      const protein = entry.protein || 0;
      const carbs = entry.carbs || 0;
      const fats = entry.fats || 0;
      const calories = (protein * 4) + (carbs * 4) + (fats * 9);
      const water = entry.water || 0;
      
      // Sum workout calories burned
      if (entry.workouts && entry.workouts.length > 0) {
        entry.workouts.forEach(workout => {
          totalWorkoutCalories += workout.caloriesBurned;
        });
      }
      
      totalCalories += calories;
      totalWater += water;
      count++;
    });
    
    const avgCalories = count > 0 ? totalCalories / count : 0;
    const avgWater = count > 0 ? totalWater / count : 0;
    const avgWorkoutCalories = count > 0 ? totalWorkoutCalories / count : 0;
    
    // Nutrition factor: lower calories = faster weight loss
    // Assume 2000 cal/day is maintenance
    if (avgCalories > 0) {
      if (avgCalories < 1500) nutritionFactor = 1.3; // Accelerated loss
      else if (avgCalories < 2000) nutritionFactor = 1.15; // Moderate loss
      else if (avgCalories < 2500) nutritionFactor = 1.0; // Maintenance
      else nutritionFactor = 0.85; // Slower loss or gain
    }
    
    // Hydration factor: better hydration = better metabolism
    if (avgWater >= 64) hydrationFactor = 1.1; // Well hydrated
    else if (avgWater >= 48) hydrationFactor = 1.0; // Adequate
    else if (avgWater > 0) hydrationFactor = 0.95; // Low hydration
    
    // Workout factor: more exercise = faster weight loss
    // Every 300 calories burned per day increases rate by 5%
    if (avgWorkoutCalories > 0) {
      workoutFactor = 1.0 + (avgWorkoutCalories / 300) * 0.05;
      workoutFactor = Math.min(workoutFactor, 1.3); // Cap at 30% boost
    }
  }
  
  // Combine factors
  const adjustedRate = weightLossRate * nutritionFactor * hydrationFactor * workoutFactor;
  
  // Project for 7, 15, 30, 180 days
  const periods = [7, 15, 30, 180];
  periods.forEach(days => {
    let projectedWeight = latestWeight - (adjustedRate * days);
    // Prevent negative or unrealistic weight (minimum 40 kg / 88 lb)
    if (projectedWeight < 40) projectedWeight = 40;
    const change = projectedWeight - latestWeight;
    
    // Display weight in lb
    const projectedLb = projectedWeight * 2.20462;
    const changeLb = change * 2.20462;
    
    document.getElementById(`proj-${days}`).textContent = `${projectedLb.toFixed(1)} lb`;
    
    const changeEl = document.getElementById(`proj-change-${days}`);
    const changeText = changeLb >= 0 ? `+${changeLb.toFixed(1)} lb` : `${changeLb.toFixed(1)} lb`;
    changeEl.textContent = changeText;
    
    // Color code
    changeEl.classList.remove('positive', 'negative', 'neutral');
    if (changeLb < -1) changeEl.classList.add('positive'); // Weight loss is positive
    else if (changeLb > 1) changeEl.classList.add('negative'); // Weight gain
    else changeEl.classList.add('neutral'); // Stable
  });
}

// Load privacy settings
function loadPrivacySettings() {
  if (!currentUser) return;
  try {
    const raw = localStorage.getItem(`btb_privacy_${currentUser}`);
    if (raw) {
      privacySettings = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load privacy settings:', e);
  }
}

// Save privacy settings
function savePrivacySettings() {
  if (!currentUser) return;
  try {
    localStorage.setItem(`btb_privacy_${currentUser}`, JSON.stringify(privacySettings));
    syncToCloud('privacy', privacySettings);
  } catch (e) {
    console.error('Failed to save privacy settings:', e);
  }
}

// Load user profile
function loadUserProfile() {
  if (!currentUser) return;
  try {
    const raw = localStorage.getItem(`btb_profile_${currentUser}`);
    if (raw) {
      userProfile = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load user profile:', e);
  }
}

// Save user profile
function saveUserProfile() {
  if (!currentUser) return;
  try {
    localStorage.setItem(`btb_profile_${currentUser}`, JSON.stringify(userProfile));
    syncToCloud('profile', userProfile);
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

// Validate that minimum baseline stats are set (age, weight, height)
function validateMinimumBaseline() {
  const baseline = loadBaselineStats();
  
  if (!baseline) {
    return {
      valid: false,
      message: 'Please set your baseline stats in Settings first. Age, Weight, and Height are required before creating entries.'
    };
  }
  
  const missing = [];
  if (!baseline.age) missing.push('Age');
  if (!baseline.weight) missing.push('Weight');
  if (!baseline.height) missing.push('Height');
  
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Please set the following required baseline stats in Settings first: ${missing.join(', ')}`
    };
  }
  
  return { valid: true, message: '' };
}

// Load baseline stats
function loadBaselineStats() {
  if (!currentUser) return null;
  try {
    const stored = localStorage.getItem(`btb_baseline_${currentUser}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load baseline stats:', e);
  }
  return null;
}

// Validate display name (basic profanity filter and content check)
function validateDisplayName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: true, error: '' }; // Empty is allowed
  }
  
  const trimmed = name.trim();
  
  // Length check
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or less' };
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  // Basic profanity/inappropriate content filter
  const inappropriate = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'piss',
    'dick', 'cock', 'pussy', 'cunt', 'fag', 'nigger', 'nigga', 'slut', 'whore',
    'retard', 'rape', 'nazi', 'hitler', 'kill', 'die', 'death', 'terrorist'
  ];
  
  const lowerName = trimmed.toLowerCase();
  for (const word of inappropriate) {
    if (lowerName.includes(word)) {
      return { valid: false, error: 'Please use an appropriate name' };
    }
  }
  
  return { valid: true, error: '' };
}

// Compute BMI given kg and cm
function computeBMI(weight, heightCm) {
  const heightMeters = heightCm / 100;
  return weight / (heightMeters * heightMeters);
}

// Compute athleticism score (now includes workout factor)
function computeAthleticism(weightKg, heightCm, musclePercent, workoutBonus = 0) {
  if (!musclePercent || isNaN(musclePercent)) return null; // Can't compute without muscle data
  const bmi = computeBMI(weightKg, heightCm);
  const baseScore = musclePercent - (bmi - 22);
  return baseScore + workoutBonus;
}

// Calculate workout bonus for athleticism (based on last 7 days)
function calculateWorkoutBonus(entries) {
  if (!entries || entries.length === 0) return 0;
  
  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentEntries = sorted.slice(-7); // Last 7 days
  
  let totalWorkoutMinutes = 0;
  let totalCaloriesBurned = 0;
  
  recentEntries.forEach(entry => {
    if (entry.workouts && entry.workouts.length > 0) {
      entry.workouts.forEach(workout => {
        totalWorkoutMinutes += workout.duration;
        totalCaloriesBurned += workout.caloriesBurned;
      });
    }
  });
  
  // Bonus calculation: 0.1 point per 30 minutes of exercise per week
  // Plus 0.05 point per 500 calories burned per week
  const minutesBonus = (totalWorkoutMinutes / 30) * 0.1;
  const caloriesBonus = (totalCaloriesBurned / 500) * 0.05;
  
  return Math.min(minutesBonus + caloriesBonus, 10); // Cap at +10 points
}

// Determine BMI category
function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

// Update silhouette
function updateSilhouette() {
  const silhouetteEl = document.getElementById('silhouette-img');
  const bmiValueEl = document.getElementById('bmi-value');
  const statusEl = document.getElementById('status-value');

  if (!silhouetteEl) return;
  if (!entries.length) {
    silhouetteEl.style.transform = 'scaleX(1)';
    silhouetteEl.style.filter = 'brightness(1)';
    bmiValueEl.textContent = '–';
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
  // Use muscle % if available, otherwise use default brightness
  const muscleBrightness = (last.muscle && !isNaN(last.muscle)) ? (0.5 + (last.muscle / 100)) : 1;
  silhouetteEl.style.transform = `scaleX(${factor.toFixed(2)})`;
  silhouetteEl.style.filter = `brightness(${muscleBrightness.toFixed(2)})`;
  bmiValueEl.textContent = bmi.toFixed(1);
  statusEl.textContent = category;
  
  // Hydration status (recommended: 64-100 oz/day)
  const hydrationEl = document.getElementById('hydration-status');
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
  
  // Nutrition status (basic calorie estimation from macros)
  const nutritionEl = document.getElementById('nutrition-status');
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
  const ctx = document.getElementById('progress-chart').getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const unitSelectEl = document.getElementById('unit-select');
  const unit = unitSelectEl ? unitSelectEl.value : 'kg';
  const weightData = sorted.map(e => unit === 'lb' ? e.weight * 2.2046226218 : e.weight);
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
  const canvas = document.getElementById('bmi-chart');
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
  const canvas = document.getElementById('athletic-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  
  // Calculate athleticism with workout bonus
  const athleticData = sorted.map((e, idx) => {
    // Get entries up to this point for workout bonus calculation
    const entriesUpToNow = sorted.slice(0, idx + 1);
    const workoutBonus = calculateWorkoutBonus(entriesUpToNow);
    return computeAthleticism(e.weight, e.height, e.muscle, workoutBonus);
  });
  
  const data = {
    labels: labels,
    datasets: [{
      label: 'Athleticism Score',
      data: athleticData,
      borderColor: '#e48bff',
      backgroundColor: 'rgba(228, 139, 255, 0.2)',
      tension: 0.2,
      spanGaps: true,
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
  const canvas = document.getElementById('water-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  // Check which view is selected
  const viewMode = document.querySelector('input[name="water-view"]:checked')?.value || 'trend';
  
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(e => e.date);
  const waterData = sorted.map(e => e.water || 0);
  
  // For daily view, use bar chart; for trend view, use line chart
  const chartType = viewMode === 'daily' ? 'bar' : 'line';
  const chartLabel = viewMode === 'daily' ? 'Daily Total (oz)' : 'Water Intake (oz)';
  
  const data = {
    labels: labels,
    datasets: [{
      label: chartLabel,
      data: waterData,
      borderColor: '#1ac0ff',
      backgroundColor: viewMode === 'daily' ? 'rgba(26, 192, 255, 0.6)' : 'rgba(26, 192, 255, 0.2)',
      tension: 0.2,
      fill: viewMode === 'trend',
    }],
  };
  
  const config = {
    type: chartType,
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
    waterChartInstance.destroy();
  }
  waterChartInstance = new Chart(ctx, config);
}

// Update macros chart
function updateMacrosChart() {
  const canvas = document.getElementById('macros-chart');
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

// Update body composition chart
function updateBodyCompChart() {
  const canvas = document.getElementById('body-comp-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sorted = entries.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Filter entries that have at least one body comp metric
  const entriesWithData = sorted.filter(e => 
    !isNaN(e.muscle) || !isNaN(e.bodyFat) || !isNaN(e.bodyWater) || !isNaN(e.boneMass)
  );
  
  if (entriesWithData.length === 0) {
    // Clear chart if no data
    if (bodyCompChartInstance) {
      bodyCompChartInstance.destroy();
      bodyCompChartInstance = null;
    }
    return;
  }
  
  const labels = entriesWithData.map(e => e.date);
  const muscleData = entriesWithData.map(e => e.muscle || null);
  const bodyFatData = entriesWithData.map(e => e.bodyFat || null);
  const bodyWaterData = entriesWithData.map(e => e.bodyWater || null);
  
  const datasets = [];
  
  // Only add datasets if they have at least some data
  if (muscleData.some(v => v !== null)) {
    datasets.push({
      label: 'Muscle %',
      data: muscleData,
      borderColor: '#34e27c',
      backgroundColor: 'rgba(52, 226, 124, 0.2)',
      tension: 0.2,
      spanGaps: true,
    });
  }
  
  if (bodyFatData.some(v => v !== null)) {
    datasets.push({
      label: 'Body Fat %',
      data: bodyFatData,
      borderColor: '#ff6b6b',
      backgroundColor: 'rgba(255, 107, 107, 0.2)',
      tension: 0.2,
      spanGaps: true,
    });
  }
  
  if (bodyWaterData.some(v => v !== null)) {
    datasets.push({
      label: 'Body Water %',
      data: bodyWaterData,
      borderColor: '#1ac0ff',
      backgroundColor: 'rgba(26, 192, 255, 0.2)',
      tension: 0.2,
      spanGaps: true,
    });
  }
  
  const data = {
    labels: labels,
    datasets: datasets,
  };
  
  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          title: { display: true, text: 'Percentage (%)', color: '#9aa8c7' },
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: false,
          min: 0,
          max: 100,
        },
        x: {
          ticks: { color: '#9aa8c7' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
        },
      },
      plugins: { legend: { labels: { color: '#e5e9f0' } } },
    },
  };
  
  if (bodyCompChartInstance) {
    bodyCompChartInstance.data.labels = labels;
    bodyCompChartInstance.data.datasets = datasets;
    bodyCompChartInstance.update();
  } else {
    bodyCompChartInstance = new Chart(ctx, config);
  }
}

// Initialize admin app
async function initAdmin() {
  // Load local data first
  entries = loadEntries();
  loadPrivacySettings();
  loadUserProfile();
  
  // Try to sync from cloud
  const cloudEntries = await loadFromCloud('entries');
  if (cloudEntries) {
    entries = mergeData(entries, cloudEntries, 'entries');
    // Save merged data locally
    try {
      localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save merged entries:', e);
    }
  }
  
  const unitSelectEl = document.getElementById('unit-select');
  const savedUnit = localStorage.getItem(`btb_unit_${currentUser}`);
  if (unitSelectEl) {
    unitSelectEl.value = savedUnit || 'kg';
  }
  
  // Set privacy toggle states
  document.getElementById('privacy-silhouette').checked = privacySettings.silhouette;
  document.getElementById('privacy-bmi').checked = privacySettings.bmi;
  document.getElementById('privacy-progress').checked = privacySettings.progress;
  document.getElementById('privacy-athleticism').checked = privacySettings.athleticism;
  document.getElementById('privacy-water').checked = privacySettings.water;
  document.getElementById('privacy-macros').checked = privacySettings.macros;
  
  const bodyCompToggle = document.getElementById('privacy-body-comp');
  if (bodyCompToggle) {
    bodyCompToggle.checked = privacySettings.bodyComp !== false;
  }
  
  // Privacy toggle handlers
  document.getElementById('privacy-silhouette').addEventListener('change', function() {
    privacySettings.silhouette = this.checked;
    savePrivacySettings();
  });
  
  document.getElementById('privacy-bmi').addEventListener('change', function() {
    privacySettings.bmi = this.checked;
    savePrivacySettings();
  });
  
  document.getElementById('privacy-progress').addEventListener('change', function() {
    privacySettings.progress = this.checked;
    savePrivacySettings();
  });
  
  document.getElementById('privacy-athleticism').addEventListener('change', function() {
    privacySettings.athleticism = this.checked;
    savePrivacySettings();
  });
  
  document.getElementById('privacy-water').addEventListener('change', function() {
    privacySettings.water = this.checked;
    savePrivacySettings();
  });
  
  document.getElementById('privacy-macros').addEventListener('change', function() {
    privacySettings.macros = this.checked;
    savePrivacySettings();
  });
  
  if (bodyCompToggle) {
    bodyCompToggle.addEventListener('change', function() {
      privacySettings.bodyComp = this.checked;
      savePrivacySettings();
    });
  }
  
  document.getElementById('privacy-projections').addEventListener('change', function() {
    privacySettings.projections = this.checked;
    savePrivacySettings();
  });
  
  const todayStr = formatDate(new Date());
  document.getElementById('date-input').value = todayStr;
  
  // Load and display baseline stats
  const baseline = loadBaselineStats();
  if (baseline) {
    console.log('Loaded baseline stats:', baseline);
    
    // Update welcome message with display name if available
    if (userProfile.displayName) {
      document.getElementById('welcome-message').textContent = `Welcome, ${userProfile.displayName}`;
    }
    
    // Pre-fill height from baseline as placeholder hint
    if (baseline.height && !isNaN(baseline.height)) {
      const totalInches = baseline.height / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round((totalInches % 12) * 10) / 10;
      document.getElementById('height-feet').placeholder = `${feet} ft (baseline)`;
      document.getElementById('height-inches').placeholder = `${inches} in (baseline)`;
    }
    
    // Pre-fill body composition from baseline as placeholder hints
    if (baseline.muscle && !isNaN(baseline.muscle)) {
      document.getElementById('muscle-input').placeholder = `${baseline.muscle}% (baseline)`;
    }
    if (baseline.bodyFat && !isNaN(baseline.bodyFat)) {
      document.getElementById('body-fat-input').placeholder = `${baseline.bodyFat}% (baseline)`;
    }
    if (baseline.bodyWater && !isNaN(baseline.bodyWater)) {
      document.getElementById('body-water-input').placeholder = `${baseline.bodyWater}% (baseline)`;
    }
    if (baseline.boneMass && !isNaN(baseline.boneMass)) {
      const boneMassLb = (baseline.boneMass * 2.20462).toFixed(1);
      document.getElementById('bone-mass-input').placeholder = `${boneMassLb} lb (baseline)`;
    }
    if (baseline.bmr && !isNaN(baseline.bmr)) {
      document.getElementById('bmr-input').placeholder = `${baseline.bmr} cal/day (baseline)`;
    }
  } else {
    console.log('No baseline stats found - user should set them in Settings');
  }
  
  // Add date change listener to update workout display
  document.getElementById('date-input').addEventListener('change', (e) => {
    displayWorkouts(e.target.value);
  });
  
  displayWorkouts(todayStr);
  updateChart();
  updateSilhouette();
  updateAthleticChart();
  updateBMIChart();
  updateWaterChart();
  updateMacrosChart();
  updateBodyCompChart();
  calculateProjections();
}

// Show admin interface
function unlockAdmin() {
  isAuthenticated = true;
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  initAdmin();
}

// Lock admin interface
function lockAdmin() {
  isAuthenticated = false;
  sessionStorage.removeItem('btb_auth_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('password-modal').style.display = 'flex';
  document.getElementById('password-input').value = '';
  document.getElementById('error-message').style.display = 'none';
}

// On DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if Chart.js loaded
  if (typeof Chart === 'undefined') {
    alert('Failed to load Chart.js library. Charts will not be displayed.');
  }

  // Attach button event listeners first (always needed)
  // Lock button
  document.getElementById('logout-btn').addEventListener('click', lockAdmin);

  // View public profile button
  document.getElementById('view-profile-btn').addEventListener('click', () => {
    window.open('index.html', '_blank');
  });
  
  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    window.location.href = 'settings.html';
  });

  // Check if already authenticated
  const authToken = sessionStorage.getItem('btb_auth_token');
  if (authToken) {
    unlockAdmin();
    return;
  }

  // Password form handler
  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password-input').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const errorMsg = document.getElementById('error-message');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    errorMsg.style.display = 'none';
    
    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        sessionStorage.setItem('btb_auth_token', data.token);
        unlockAdmin();
      } else {
        errorMsg.style.display = 'block';
        document.getElementById('password-input').value = '';
      }
    } catch (error) {
      errorMsg.textContent = 'Authentication error. Please try again.';
      errorMsg.style.display = 'block';
      console.error('Auth error:', error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });

  // Entry form handler (stats: date, weight, height, muscle, body composition)
  document.getElementById('entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate minimum baseline stats first
    const baselineCheck = validateMinimumBaseline();
    if (!baselineCheck.valid) {
      alert(baselineCheck.message);
      return;
    }
    
    const date = document.getElementById('date-input').value;
    let weight = parseFloat(document.getElementById('weight-input').value);
    const heightFeet = parseFloat(document.getElementById('height-feet').value);
    const heightInches = parseFloat(document.getElementById('height-inches').value) || 0;
    const muscle = parseFloat(document.getElementById('muscle-input').value);
    const bodyFat = parseFloat(document.getElementById('body-fat-input').value);
    const bodyWater = parseFloat(document.getElementById('body-water-input').value);
    let boneMass = parseFloat(document.getElementById('bone-mass-input').value);
    const bmr = parseFloat(document.getElementById('bmr-input').value);
    
    if (!date || isNaN(weight)) return;
    
    let height;
    // If height not provided, use baseline height
    if (isNaN(heightFeet)) {
      const baseline = loadBaselineStats();
      if (!baseline || !baseline.height) {
        alert('Please set your baseline height in Settings first, or enter height for this entry.');
        return;
      }
      height = baseline.height;
    } else {
      // Validate provided height
      if (heightFeet < 3 || heightFeet > 9 || heightInches < 0 || heightInches >= 12) {
        alert('Please enter a valid height (3-9 feet, 0-11 inches)');
        return;
      }
      // Convert feet-inches to cm
      const totalInches = (heightFeet * 12) + heightInches;
      height = totalInches * 2.54;
    }
    
    const unitVal = document.getElementById('unit-select').value;
    const minWeight = unitVal === 'lb' ? 44 : 20;
    const maxWeight = unitVal === 'lb' ? 1100 : 500;
    
    if (weight < minWeight || weight > maxWeight) {
      alert(`Weight must be between ${minWeight} and ${maxWeight} ${unitVal}`);
      return;
    }
    
    // Validate optional fields if provided
    if (!isNaN(muscle) && (muscle < 5 || muscle > 70)) {
      alert('Muscle percentage must be between 5% and 70%');
      return;
    }
    if (!isNaN(bodyFat) && (bodyFat < 3 || bodyFat > 60)) {
      alert('Body fat percentage must be between 3% and 60%');
      return;
    }
    if (!isNaN(bodyWater) && (bodyWater < 35 || bodyWater > 75)) {
      alert('Body water percentage must be between 35% and 75%');
      return;
    }
    if (!isNaN(boneMass) && (boneMass < 2 || boneMass > 20)) {
      alert('Bone mass must be between 2 and 20 lb');
      return;
    }
    if (!isNaN(bmr) && (bmr < 800 || bmr > 4000)) {
      alert('BMR must be between 800 and 4000 cal/day');
      return;
    }
    
    if (unitVal === 'lb') {
      weight = weight * 0.45359237;
      // Convert bone mass from lb to kg if provided
      if (!isNaN(boneMass)) boneMass = boneMass * 0.45359237;
    }

    
    const existingEntry = entries.find(e => e.date === date);
    if (existingEntry) {
      if (!confirm(`Replace entry for ${date}?`)) return;
    }
    
    if (entries.length >= 365 && !existingEntry) {
      alert('Maximum 365 entries reached. Delete old entries first.');
      return;
    }
    
    const newEntry = existingEntry ? {
      ...existingEntry, 
      weight, 
      height, 
      muscle: isNaN(muscle) ? existingEntry.muscle : muscle,
      bodyFat: isNaN(bodyFat) ? existingEntry.bodyFat : bodyFat,
      bodyWater: isNaN(bodyWater) ? existingEntry.bodyWater : bodyWater,
      boneMass: isNaN(boneMass) ? existingEntry.boneMass : boneMass,
      bmr: isNaN(bmr) ? existingEntry.bmr : bmr
    } : { 
      date, 
      weight, 
      height, 
      muscle: isNaN(muscle) ? undefined : muscle,
      bodyFat: isNaN(bodyFat) ? undefined : bodyFat,
      bodyWater: isNaN(bodyWater) ? undefined : bodyWater,
      boneMass: isNaN(boneMass) ? undefined : boneMass,
      bmr: isNaN(bmr) ? undefined : bmr,
      water: 0, 
      protein: 0, 
      carbs: 0, 
      fats: 0 
    };
    entries = entries.filter(e => e.date !== date);
    entries.push(newEntry);
    saveEntries();
    updateChart();
    updateSilhouette();
    updateAthleticChart();
    updateBMIChart();
    updateWaterChart();
    updateMacrosChart();
    updateBodyCompChart();
    calculateProjections();
    
    document.getElementById('weight-input').value = '';
    document.getElementById('muscle-input').value = '';
    document.getElementById('body-fat-input').value = '';
    document.getElementById('body-water-input').value = '';
    document.getElementById('bone-mass-input').value = '';
    document.getElementById('bmr-input').value = '';
    alert('Stats entry added successfully!');
  });

  // Hydration form handler
  document.getElementById('hydration-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate minimum baseline stats first
    const baselineCheck = validateMinimumBaseline();
    if (!baselineCheck.valid) {
      alert(baselineCheck.message);
      return;
    }
    
    const date = document.getElementById('date-input').value;
    const waterToAdd = parseFloat(document.getElementById('water-input').value) || 0;
    
    if (!date) {
      alert('Please set a date in the Log your stats section first!');
      return;
    }
    
    let existingEntry = entries.find(e => e.date === date);
    if (!existingEntry) {
      alert('Please add a stats entry for this date first!');
      return;
    }
    
    // Add to existing water amount (cumulative)
    existingEntry.water = (existingEntry.water || 0) + waterToAdd;
    saveEntries();
    updateWaterChart();
    calculateProjections();
    
    document.getElementById('water-input').value = '';
    alert(`Added ${waterToAdd} oz. Total for ${date}: ${existingEntry.water} oz`);
  });

  // Workout form handler
  document.getElementById('workout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate minimum baseline stats first
    const baselineCheck = validateMinimumBaseline();
    if (!baselineCheck.valid) {
      alert(baselineCheck.message);
      return;
    }
    
    const date = document.getElementById('date-input').value;
    const workoutType = document.getElementById('workout-type').value;
    const duration = parseInt(document.getElementById('workout-duration').value);
    const intensity = document.getElementById('workout-intensity').value;
    
    if (!date) {
      alert('Please set a date in the Log your stats section first!');
      return;
    }
    
    let existingEntry = entries.find(e => e.date === date);
    if (!existingEntry) {
      alert('Please add a stats entry for this date first (need weight for calorie calculation)!');
      return;
    }
    
    if (!existingEntry.weight) {
      alert('Please add weight data for this date first (needed for calorie calculation)!');
      return;
    }
    
    // Calculate calories burned
    const caloriesBurned = calculateWorkoutCalories(workoutType, duration, intensity, existingEntry.weight);
    
    // Initialize workouts array if needed
    if (!existingEntry.workouts) {
      existingEntry.workouts = [];
    }
    
    // Add workout
    existingEntry.workouts.push({
      type: workoutType,
      duration: duration,
      intensity: intensity,
      caloriesBurned: caloriesBurned
    });
    
    saveEntries();
    displayWorkouts(date);
    calculateProjections();
    updateAthleticChart();
    
    document.getElementById('workout-type').value = '';
    document.getElementById('workout-duration').value = '';
    document.getElementById('workout-intensity').value = 'moderate';
    
    alert(`Added ${workoutType} workout! Burned ~${caloriesBurned} calories`);
  });
  
  // Display workouts for current date
  function displayWorkouts(date) {
    const entry = entries.find(e => e.date === date);
    const workoutList = document.getElementById('workout-list');
    
    if (!entry || !entry.workouts || entry.workouts.length === 0) {
      workoutList.innerHTML = '<p style="color: #9aa8c7; font-size: 13px;">No workouts logged for this date</p>';
      return;
    }
    
    const totalCalories = entry.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    
    workoutList.innerHTML = `
      <div style="background: #1a1d2e; padding: 12px; border-radius: 6px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #fff;">Today's Workouts</h4>
        ${entry.workouts.map((w, idx) => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #2d3548; font-size: 12px;">
            <div>
              <strong>${w.type}</strong> - ${w.duration} min (${w.intensity})
            </div>
            <div style="color: #4ade80;">
              ${w.caloriesBurned} cal
              <button onclick="removeWorkout('${date}', ${idx})" style="margin-left: 8px; padding: 2px 8px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">✕</button>
            </div>
          </div>
        `).join('')}
        <div style="margin-top: 8px; padding-top: 8px; border-top: 2px solid #2d3548; text-align: right; font-weight: bold; color: #4ade80;">
          Total: ${totalCalories} calories burned
        </div>
      </div>
    `;
  }
  
  // Remove workout function (global scope)
  window.removeWorkout = function(date, index) {
    const entry = entries.find(e => e.date === date);
    if (entry && entry.workouts) {
      entry.workouts.splice(index, 1);
      saveEntries();
      displayWorkouts(date);
      calculateProjections();
      updateAthleticChart();
    }
  };

  // Nutrition form handler
  document.getElementById('nutrition-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Validate minimum baseline stats first
    const baselineCheck = validateMinimumBaseline();
    if (!baselineCheck.valid) {
      alert(baselineCheck.message);
      return;
    }
    
    const date = document.getElementById('date-input').value;
    const proteinToAdd = parseFloat(document.getElementById('protein-input').value) || 0;
    const carbsToAdd = parseFloat(document.getElementById('carbs-input').value) || 0;
    const fatsToAdd = parseFloat(document.getElementById('fats-input').value) || 0;
    
    if (!date) {
      alert('Please set a date in the Log your stats section first!');
      return;
    }
    
    let existingEntry = entries.find(e => e.date === date);
    if (!existingEntry) {
      alert('Please add a stats entry for this date first!');
      return;
    }
    
    // Add to existing macro amounts (cumulative)
    existingEntry.protein = (existingEntry.protein || 0) + proteinToAdd;
    existingEntry.carbs = (existingEntry.carbs || 0) + carbsToAdd;
    existingEntry.fats = (existingEntry.fats || 0) + fatsToAdd;
    saveEntries();
    updateMacrosChart();
    calculateProjections();
    
    document.getElementById('protein-input').value = '';
    document.getElementById('carbs-input').value = '';
    document.getElementById('fats-input').value = '';
    alert(`Added macros. Totals for ${date}: P:${existingEntry.protein}g C:${existingEntry.carbs}g F:${existingEntry.fats}g`);
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', () => {
    if (!entries.length) {
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

  // Import button
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  // File import handler
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
        if (confirm(`Import ${importedData.entries.length} entries? This will replace current data.`)) {
          entries = importedData.entries;
          saveEntries();
          updateChart();
          updateSilhouette();
          updateAthleticChart();
          updateBMIChart();
          updateWaterChart();
          updateMacrosChart();
          updateBodyCompChart();
          alert('Data imported successfully!');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Check file format.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // Unit selector
  const unitSelector = document.getElementById('unit-select');
  if (unitSelector) {
    unitSelector.addEventListener('change', (e) => {
      const selectedUnit = e.target.value;
      if (currentUser) {
        localStorage.setItem(`btb_unit_${currentUser}`, selectedUnit);
      }
      const weightInput = document.getElementById('weight-input');
      if (weightInput && weightInput.value) {
        if (confirm('Unit changed. Clear weight field?')) {
          weightInput.value = '';
        }
      }
      if (weightInput) {
        weightInput.placeholder = selectedUnit === 'lb' ? 'e.g. 165' : 'e.g. 75';
      }
      updateChart();
      updateAthleticChart();
      updateBMIChart();
      updateWaterChart();
      updateMacrosChart();
    });
  }
  
  // Privacy toggle event listeners
  document.getElementById('privacy-silhouette').addEventListener('change', (e) => {
    privacySettings.silhouette = e.target.checked;
    savePrivacySettings();
  });
  document.getElementById('privacy-bmi').addEventListener('change', (e) => {
    privacySettings.bmi = e.target.checked;
    savePrivacySettings();
  });
  document.getElementById('privacy-progress').addEventListener('change', (e) => {
    privacySettings.progress = e.target.checked;
    savePrivacySettings();
  });
  document.getElementById('privacy-athleticism').addEventListener('change', (e) => {
    privacySettings.athleticism = e.target.checked;
    savePrivacySettings();
  });
  document.getElementById('privacy-water').addEventListener('change', (e) => {
    privacySettings.water = e.target.checked;
    savePrivacySettings();
  });
  document.getElementById('privacy-macros').addEventListener('change', (e) => {
    privacySettings.macros = e.target.checked;
    savePrivacySettings();
  });
  
  // Water chart view toggle
  document.querySelectorAll('input[name="water-view"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateWaterChart();
    });
  });
  
  // Macros chart view toggle
  document.querySelectorAll('input[name="macros-view"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateMacrosChart();
    });
  });
});
