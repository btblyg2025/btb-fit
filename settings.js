// Settings page script for btb.fit

const ADMIN_USER = 'btbga';

let currentUser = ADMIN_USER;
let userProfile = {
  displayName: '',
  heightUnit: 'imperial' // 'imperial' or 'metric'
};

// Privacy cards as array of objects
let privacyCards = [
  { id: 'silhouette', name: 'User Silhouette', isVisible: true },
  { id: 'bmi', name: 'BMI Over Time', isVisible: true },
  { id: 'progress', name: 'Progress Chart', isVisible: true },
  { id: 'athleticism', name: 'Athleticism Score', isVisible: true },
  { id: 'water', name: 'Water Intake', isVisible: true },
  { id: 'macros', name: 'Daily Macros', isVisible: true },
  { id: 'bodyComp', name: 'Body Composition', isVisible: true },
  { id: 'projections', name: 'Weight Projections', isVisible: true },
  { id: 'caloricBalance', name: 'Caloric Balance', isVisible: true },
  { id: 'strengthWeight', name: 'Strength-to-Weight', isVisible: true },
  { id: 'recomposition', name: 'Body Recomposition', isVisible: true },
  { id: 'consistency', name: 'Consistency Tracker', isVisible: true },
  { id: 'boneBmr', name: 'Bone Density & BMR', isVisible: true }
];

let entries = [];
let isAuthenticated = false;
let baselineEditMode = false;
let profileEditMode = false;

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
  } catch (e) {
    console.error('Failed to save user profile:', e);
  }
}

// Load privacy settings from server
async function loadPrivacySettings() {
  if (!currentUser) return;
  try {
    // Try to load from server first
    const response = await fetch('/api/load-privacy', {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      const savedSettings = result.data;
      
      // Update each card's visibility from saved settings
      privacyCards.forEach(card => {
        if (savedSettings.hasOwnProperty(card.id)) {
          card.isVisible = savedSettings[card.id];
        }
      });
      
      // Also save to localStorage for offline access
      localStorage.setItem(`btb_privacy_${currentUser}`, JSON.stringify(savedSettings));
      console.log('Privacy settings loaded from server');
    } else {
      // Fallback to localStorage if server fails
      const raw = localStorage.getItem(`btb_privacy_${currentUser}`);
      if (raw) {
        const savedSettings = JSON.parse(raw);
        privacyCards.forEach(card => {
          if (savedSettings.hasOwnProperty(card.id)) {
            card.isVisible = savedSettings[card.id];
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to load privacy settings:', e);
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(`btb_privacy_${currentUser}`);
      if (raw) {
        const savedSettings = JSON.parse(raw);
        privacyCards.forEach(card => {
          if (savedSettings.hasOwnProperty(card.id)) {
            card.isVisible = savedSettings[card.id];
          }
        });
      }
    } catch (err) {
      console.error('localStorage fallback failed:', err);
    }
  }
}

// Save privacy settings to server and localStorage
async function savePrivacySettings() {
  if (!currentUser) return;
  try {
    // Convert array back to object format for storage
    const settingsObj = {};
    privacyCards.forEach(card => {
      settingsObj[card.id] = card.isVisible;
    });
    
    // Save to localStorage immediately
    localStorage.setItem(`btb_privacy_${currentUser}`, JSON.stringify(settingsObj));
    
    // Sync to server
    const token = sessionStorage.getItem('btb_auth_token');
    if (token) {
      const response = await fetch('/api/save-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, privacySettings: settingsObj })
      });
      
      if (response.ok) {
        console.log('✓ Privacy settings synced to server');
      } else {
        console.warn('Failed to sync privacy to server');
      }
    }
  } catch (e) {
    console.error('Failed to save privacy settings:', e);
  }
}

// Load entries for the current user from localStorage
function loadEntries() {
  if (!currentUser) return [];
  try {
    const raw = localStorage.getItem(`btb_entries_${currentUser}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load entries from localStorage:', e);
    return [];
  }
}

// Load baseline stats
function loadBaselineStats() {
  if (!currentUser) return null;
  try {
    const raw = localStorage.getItem(`btb_baseline_${currentUser}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load baseline stats:', e);
    return null;
  }
}

// Save baseline stats
function saveBaselineStats(baseline) {
  if (!currentUser) return;
  try {
    localStorage.setItem(`btb_baseline_${currentUser}`, JSON.stringify(baseline));
    syncToCloud('baseline', baseline);
  } catch (e) {
    console.error('Failed to save baseline stats:', e);
  }
}

// Sync data to Netlify Blobs
async function syncToCloud(dataType, data) {
  const token = sessionStorage.getItem('btb_auth_token');
  if (!token) return;
  
  try {
    const response = await fetch('/api/save-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, dataType, data })
    });
    
    if (response.ok) {
      console.log(`✓ ${dataType} synced to cloud`);
    }
  } catch (error) {
    console.warn('Cloud sync failed:', error);
  }
}

// Validate display name
function validateDisplayName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: true, error: '' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (trimmed.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or less' };
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
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

// Update the saved data display at the top
function updateSavedDataDisplay() {
  console.log('updateSavedDataDisplay called');
  
  // Reload fresh from localStorage
  const baseline = loadBaselineStats();
  loadUserProfile(); // Reload userProfile from localStorage
  const profile = userProfile;
  
  console.log('Baseline data:', baseline);
  console.log('Profile data:', profile);
  
  // Display name
  const displayNameEl = document.getElementById('display-name-display');
  console.log('Display name element:', displayNameEl);
  if (displayNameEl) {
    displayNameEl.textContent = profile.displayName || 'Not set';
    displayNameEl.style.color = profile.displayName ? '#34e27c' : '#9aa8c7';
  }
  
  // Age
  const ageEl = document.getElementById('age-display');
  if (ageEl && baseline && baseline.age) {
    ageEl.textContent = baseline.age + ' years';
    ageEl.style.color = '#34e27c';
  } else if (ageEl) {
    ageEl.textContent = 'Not set';
    ageEl.style.color = '#9aa8c7';
  }
  
  // Height
  const heightEl = document.getElementById('height-display');
  if (heightEl && baseline && baseline.height) {
    const heightCm = baseline.height;
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    heightEl.textContent = `${feet}'${inches}" (${heightCm.toFixed(1)} cm)`;
    heightEl.style.color = '#34e27c';
  } else if (heightEl) {
    heightEl.textContent = 'Not set';
    heightEl.style.color = '#9aa8c7';
  }
  
  // Weight
  const weightEl = document.getElementById('weight-display');
  if (weightEl && baseline && baseline.weight) {
    weightEl.textContent = `${baseline.weightDisplay} ${baseline.weightUnit}`;
    weightEl.style.color = '#34e27c';
  } else if (weightEl) {
    weightEl.textContent = 'Not set';
    weightEl.style.color = '#9aa8c7';
  }
  
  // Muscle
  const muscleEl = document.getElementById('muscle-display');
  if (muscleEl && baseline && baseline.muscle) {
    muscleEl.textContent = baseline.muscle + '%';
    muscleEl.style.color = '#34e27c';
  } else if (muscleEl) {
    muscleEl.textContent = 'Not set';
    muscleEl.style.color = '#9aa8c7';
  }
  
  // Body Fat
  const bodyFatEl = document.getElementById('body-fat-display');
  if (bodyFatEl && baseline && baseline.bodyFat) {
    bodyFatEl.textContent = baseline.bodyFat + '%';
    bodyFatEl.style.color = '#34e27c';
  } else if (bodyFatEl) {
    bodyFatEl.textContent = 'Not set';
    bodyFatEl.style.color = '#9aa8c7';
  }
  
  // Body Water
  const bodyWaterEl = document.getElementById('body-water-display');
  if (bodyWaterEl && baseline && baseline.bodyWater) {
    bodyWaterEl.textContent = baseline.bodyWater + '%';
    bodyWaterEl.style.color = '#34e27c';
  } else if (bodyWaterEl) {
    bodyWaterEl.textContent = 'Not set';
    bodyWaterEl.style.color = '#9aa8c7';
  }
  
  // Bone Mass
  const boneMassEl = document.getElementById('bone-mass-display');
  if (boneMassEl && baseline && baseline.boneMass) {
    const boneMassLb = (baseline.boneMass * 2.20462).toFixed(1);
    boneMassEl.textContent = boneMassLb + ' lb';
    boneMassEl.style.color = '#34e27c';
  } else if (boneMassEl) {
    boneMassEl.textContent = 'Not set';
    boneMassEl.style.color = '#9aa8c7';
  }
  
  // BMR
  const bmrEl = document.getElementById('bmr-display');
  if (bmrEl && baseline && baseline.bmr) {
    bmrEl.textContent = baseline.bmr + ' cal/day';
    bmrEl.style.color = '#34e27c';
  } else if (bmrEl) {
    bmrEl.textContent = 'Not set';
    bmrEl.style.color = '#9aa8c7';
  }
  
  console.log('Display update complete');
}

// Initialize settings UI
async function initSettings() {
  console.log('initSettings started');
  loadUserProfile();
  await loadPrivacySettings();
  
  // Update the saved data display
  updateSavedDataDisplay();
  
  // Set privacy toggle states and labels
  privacyCards.forEach(card => {
    // Map card IDs to HTML element IDs (handle special cases with dashes)
    let toggleId;
    if (card.id === 'bodyComp') {
      toggleId = 'privacy-body-comp';
    } else if (card.id === 'caloricBalance') {
      toggleId = 'privacy-caloric-balance';
    } else if (card.id === 'strengthWeight') {
      toggleId = 'privacy-strength-weight';
    } else if (card.id === 'boneBmr') {
      toggleId = 'privacy-bone-bmr';
    } else {
      toggleId = `privacy-${card.id}`;
    }
    
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.checked = card.isVisible;
      const label = toggle.parentElement.querySelector('.toggle-label');
      if (label) {
        label.textContent = card.isVisible ? 'Public' : 'Private';
        label.style.color = card.isVisible ? '#34e27c' : '#e57373';
      }
    }
  });
  
  console.log('Setting up field selector event listener...');
  const fieldSelector = document.getElementById('field-selector');
  console.log('Field selector element:', fieldSelector);
  
  if (fieldSelector) {
    fieldSelector.addEventListener('change', (e) => {
      console.log('Field selector changed:', e.target.value);
      const fieldName = e.target.value;
      if (fieldName) {
        showFieldEditor(fieldName);
      } else {
        hideFieldEditor();
      }
    });
    console.log('Field selector event listener attached');
  } else {
    console.error('Field selector not found!');
  }
  
  // Field edit form submit handler
  const fieldEditForm = document.getElementById('field-edit-form');
  console.log('Field edit form:', fieldEditForm);
  if (fieldEditForm) {
    fieldEditForm.addEventListener('submit', saveFieldEdit);
  }
  
  // Cancel button handler
  const cancelBtn = document.getElementById('cancel-field-edit');
  console.log('Cancel button:', cancelBtn);
  if (cancelBtn) {
    cancelBtn.addEventListener('click', hideFieldEditor);
  }
  
  // Privacy toggle event listeners
  privacyCards.forEach(card => {
    // Map card IDs to HTML element IDs (handle special cases with dashes)
    let toggleId;
    if (card.id === 'bodyComp') {
      toggleId = 'privacy-body-comp';
    } else if (card.id === 'caloricBalance') {
      toggleId = 'privacy-caloric-balance';
    } else if (card.id === 'strengthWeight') {
      toggleId = 'privacy-strength-weight';
    } else if (card.id === 'boneBmr') {
      toggleId = 'privacy-bone-bmr';
    } else {
      toggleId = `privacy-${card.id}`;
    }
    
    const toggle = document.getElementById(toggleId);
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        card.isVisible = e.target.checked;
        const label = e.target.parentElement.querySelector('.toggle-label');
        if (label) {
          label.textContent = card.isVisible ? 'Public' : 'Private';
          label.style.color = card.isVisible ? '#34e27c' : '#e57373';
        }
        savePrivacySettings(); // Now handles both localStorage and server sync
      });
    }
  });
  
  console.log('initSettings complete');
}

// Show settings interface
async function unlockSettings() {
  isAuthenticated = true;
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  
  // Migrate existing localStorage privacy to server if needed
  await migratePrivacyToServer();
  
  await initSettings();
}

// Migrate existing localStorage privacy settings to server
async function migratePrivacyToServer() {
  const token = sessionStorage.getItem('btb_auth_token');
  if (!token || !currentUser) return;
  
  try {
    // Check if server already has privacy data
    const checkResponse = await fetch('/api/load-privacy', { method: 'GET' });
    if (checkResponse.ok) {
      const result = await checkResponse.json();
      
      // If server has no data or has default data, migrate from localStorage
      const hasServerData = result.data && Object.keys(result.data).length > 0;
      const isDefaultData = hasServerData && Object.values(result.data).every(v => v === true);
      
      if (!hasServerData || isDefaultData) {
        // Try to get localStorage privacy settings
        const localPrivacy = localStorage.getItem(`btb_privacy_${currentUser}`);
        if (localPrivacy) {
          const settingsObj = JSON.parse(localPrivacy);
          
          // Sync to server
          const saveResponse = await fetch('/api/save-privacy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, privacySettings: settingsObj })
          });
          
          if (saveResponse.ok) {
            console.log('✓ Migrated privacy settings from localStorage to server');
          }
        }
      }
    }
  } catch (e) {
    console.warn('Privacy migration skipped:', e);
  }
}

// Lock settings interface
function lockSettings() {
  isAuthenticated = false;
  sessionStorage.removeItem('btb_auth_token');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('password-modal').style.display = 'flex';
  document.getElementById('password-input').value = '';
  document.getElementById('error-message').style.display = 'none';
}

// Field editor handlers
function showFieldEditor(fieldName) {
  console.log('showFieldEditor called with:', fieldName);
  const container = document.getElementById('field-editor-container');
  const content = document.getElementById('field-edit-content');
  console.log('Container:', container);
  console.log('Content:', content);
  
  const baseline = loadBaselineStats();
  const profile = userProfile;
  
  console.log('Baseline:', baseline);
  console.log('Profile:', profile);
  
  let html = '';
  
  switch(fieldName) {
    case 'displayName':
      html = `
        <label>Display Name</label>
        <input type="text" id="edit-field-input" value="${profile.displayName || ''}" placeholder="e.g. Brandon" maxlength="50" required>
        <p style="font-size: 11px; color: #7c8aa9; margin-top: 4px;">
          Public profile will show: "{Your Name}'s Fitness Journey"
        </p>
      `;
      break;
    case 'age':
      html = `
        <label>Age</label>
        <input type="number" id="edit-field-input" value="${baseline?.age || ''}" min="13" max="120" placeholder="e.g., 25" required>
      `;
      break;
    case 'height':
      const heightCm = baseline?.height || 0;
      const heightUnit = userProfile?.heightUnit || 'imperial';
      const totalInches = heightCm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = (totalInches % 12).toFixed(1);
      html = `
        <label>Height</label>
        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
          <select id="height-unit-toggle" class="unit-select" style="flex: 1;">
            <option value="imperial" ${heightUnit === 'imperial' ? 'selected' : ''}>Imperial (ft/in)</option>
            <option value="metric" ${heightUnit === 'metric' ? 'selected' : ''}>Metric (cm)</option>
          </select>
        </div>
        <div id="height-input-container">
          ${heightUnit === 'imperial' ? `
            <div style="display: flex; gap: 8px;">
              <input type="number" id="edit-field-ft" value="${heightCm ? feet : ''}" placeholder="ft" min="0" max="8" required>
              <input type="number" id="edit-field-in" value="${heightCm ? inches : ''}" placeholder="in" min="0" max="11" step="0.5" required>
            </div>
          ` : `
            <input type="number" id="edit-field-cm" value="${heightCm || ''}" placeholder="cm" min="100" max="250" step="0.1" required>
          `}
        </div>
      `;
      
      // Add event listener to toggle between units after rendering
      setTimeout(() => {
        const unitToggle = document.getElementById('height-unit-toggle');
        if (unitToggle) {
          unitToggle.addEventListener('change', function() {
            const newUnit = this.value;
            userProfile.heightUnit = newUnit;
            const container = document.getElementById('height-input-container');
            const currentHeightCm = baseline?.height || 0;
            const currentInches = currentHeightCm / 2.54;
            const currentFeet = Math.floor(currentInches / 12);
            const currentIn = (currentInches % 12).toFixed(1);
            
            if (newUnit === 'imperial') {
              container.innerHTML = `
                <div style="display: flex; gap: 8px;">
                  <input type="number" id="edit-field-ft" value="${currentHeightCm ? currentFeet : ''}" placeholder="ft" min="0" max="8" required>
                  <input type="number" id="edit-field-in" value="${currentHeightCm ? currentIn : ''}" placeholder="in" min="0" max="11" step="0.5" required>
                </div>
              `;
            } else {
              container.innerHTML = `
                <input type="number" id="edit-field-cm" value="${currentHeightCm || ''}" placeholder="cm" min="100" max="250" step="0.1" required>
              `;
            }
          });
        }
      }, 0);
      break;
    case 'weight':
      html = `
        <label>Weight</label>
        <div class="input-group">
          <input type="number" id="edit-field-input" value="${baseline?.weightDisplay || ''}" step="0.1" min="0" placeholder="e.g. 180" required>
          <select id="edit-field-unit" class="unit-select">
            <option value="lb" ${baseline?.weightUnit === 'lb' ? 'selected' : ''}>lb</option>
            <option value="kg" ${baseline?.weightUnit === 'kg' ? 'selected' : ''}>kg</option>
          </select>
        </div>
      `;
      break;
    case 'muscle':
      html = `
        <label>Muscle %</label>
        <input type="number" id="edit-field-input" value="${baseline?.muscle || ''}" step="0.1" min="5" max="70" placeholder="e.g. 35">
      `;
      break;
    case 'bodyFat':
      html = `
        <label>Body Fat %</label>
        <input type="number" id="edit-field-input" value="${baseline?.bodyFat || ''}" step="0.1" min="3" max="60" placeholder="e.g. 18">
      `;
      break;
    case 'bodyWater':
      html = `
        <label>Body Water %</label>
        <input type="number" id="edit-field-input" value="${baseline?.bodyWater || ''}" step="0.1" min="35" max="75" placeholder="e.g. 55">
      `;
      break;
    case 'boneMass':
      const boneMassLb = baseline?.boneMass ? (baseline.boneMass * 2.20462).toFixed(1) : '';
      html = `
        <label>Bone Mass (lb)</label>
        <input type="number" id="edit-field-input" value="${boneMassLb}" step="0.1" min="2" max="20" placeholder="e.g. 6.5">
      `;
      break;
    case 'bmr':
      html = `
        <label>BMR (cal/day)</label>
        <input type="number" id="edit-field-input" value="${baseline?.bmr || ''}" step="1" min="800" max="4000" placeholder="e.g. 1650">
      `;
      break;
  }
  
  console.log('Generated HTML:', html);
  content.innerHTML = html;
  container.style.display = 'block';
  console.log('Field editor shown');
}

function hideFieldEditor() {
  document.getElementById('field-editor-container').style.display = 'none';
  document.getElementById('field-selector').value = '';
}

function saveFieldEdit(e) {
  e.preventDefault();
  console.log('saveFieldEdit called');
  
  const fieldName = document.getElementById('field-selector').value;
  console.log('Field name:', fieldName);
  if (!fieldName) return;
  
  const baseline = loadBaselineStats() || {};
  const profile = userProfile;
  
  console.log('Current baseline:', baseline);
  console.log('Current profile:', profile);
  
  switch(fieldName) {
    case 'displayName':
      const displayName = document.getElementById('edit-field-input').value.trim();
      const validation = validateDisplayName(displayName);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      userProfile.displayName = displayName;
      saveUserProfile();
      syncToCloud('profile', userProfile);
      break;
      
    case 'age':
      baseline.age = parseInt(document.getElementById('edit-field-input').value);
      saveBaselineStats(baseline);
      break;
      
    case 'height':
      const heightUnit = userProfile?.heightUnit || 'imperial';
      if (heightUnit === 'imperial') {
        const feet = parseFloat(document.getElementById('edit-field-ft').value);
        const inches = parseFloat(document.getElementById('edit-field-in').value);
        const totalInches = (feet * 12) + inches;
        baseline.height = totalInches * 2.54;
      } else {
        baseline.height = parseFloat(document.getElementById('edit-field-cm').value);
      }
      saveUserProfile(); // Save unit preference
      saveBaselineStats(baseline);
      break;
      
    case 'weight':
      const weightInput = parseFloat(document.getElementById('edit-field-input').value);
      const weightUnit = document.getElementById('edit-field-unit').value;
      baseline.weightDisplay = weightInput;
      baseline.weightUnit = weightUnit;
      baseline.weight = weightUnit === 'lb' ? weightInput / 2.20462 : weightInput;
      saveBaselineStats(baseline);
      break;
      
    case 'muscle':
      const muscle = parseFloat(document.getElementById('edit-field-input').value);
      baseline.muscle = isNaN(muscle) ? undefined : muscle;
      saveBaselineStats(baseline);
      break;
      
    case 'bodyFat':
      const bodyFat = parseFloat(document.getElementById('edit-field-input').value);
      baseline.bodyFat = isNaN(bodyFat) ? undefined : bodyFat;
      saveBaselineStats(baseline);
      break;
      
    case 'bodyWater':
      const bodyWater = parseFloat(document.getElementById('edit-field-input').value);
      baseline.bodyWater = isNaN(bodyWater) ? undefined : bodyWater;
      saveBaselineStats(baseline);
      break;
      
    case 'boneMass':
      const boneMassLb = parseFloat(document.getElementById('edit-field-input').value);
      baseline.boneMass = isNaN(boneMassLb) ? undefined : boneMassLb * 0.45359237;
      saveBaselineStats(baseline);
      break;
      
    case 'bmr':
      const bmr = parseFloat(document.getElementById('edit-field-input').value);
      baseline.bmr = isNaN(bmr) ? undefined : bmr;
      saveBaselineStats(baseline);
      break;
  }
  
  console.log('Saving baseline:', baseline);
  console.log('Updating display...');
  updateSavedDataDisplay();
  hideFieldEditor();
  
  // Debug: Log what's in localStorage after save
  const stored = localStorage.getItem(`btb_baseline_${currentUser}`);
  console.log('Data in localStorage after save:', stored);
  
  alert('Field updated successfully!');
}

// On DOM ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Settings page loaded');
  
  // Attach button event listeners first (always needed)
  // Lock button
  document.getElementById('logout-btn').addEventListener('click', () => {
    lockSettings();
  });

  // Back to admin button
  document.getElementById('back-to-admin-btn').addEventListener('click', () => {
    window.location.href = 'admin.html';
  });

  // View public profile button
  document.getElementById('view-profile-btn').addEventListener('click', () => {
    window.open('index.html', '_blank');
  });
  
  // Check if already authenticated
  const authToken = sessionStorage.getItem('btb_auth_token');
  if (authToken) {
    console.log('Already authenticated, unlocking...');
    unlockSettings();
    return;
  }
  
  // Password form handler
  const passwordForm = document.getElementById('password-form');
  console.log('Password form:', passwordForm);
  
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const password = document.getElementById('password-input').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const errorMsg = document.getElementById('error-message');
    
    console.log('Password length:', password.length);
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying...';
    errorMsg.style.display = 'none';
    
    try {
      console.log('Calling API...');
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.valid) {
        console.log('Password valid, unlocking...');
        sessionStorage.setItem('btb_auth_token', data.token);
        unlockSettings();
      } else {
        console.log('Password invalid');
        errorMsg.style.display = 'block';
        document.getElementById('password-input').value = '';
      }
    } catch (error) {
      console.error('Fetch error:', error);
      errorMsg.textContent = 'Authentication error. Please try again.';
      errorMsg.style.display = 'block';
      console.error('Auth error:', error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });

  // Export button
  document.getElementById('export-btn').addEventListener('click', () => {
    entries = loadEntries();
    if (!entries.length) {
      alert('No data to export!');
      return;
    }
    const dataToExport = {
      username: currentUser,
      exportDate: new Date().toISOString(),
      entries: entries,
      profile: userProfile,
      privacy: privacySettings
    };
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `btb_fit_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import button
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.entries || !Array.isArray(data.entries)) {
          alert('Invalid file format!');
          return;
        }
        if (confirm(`Import ${data.entries.length} entries? This will replace your current data.`)) {
          localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(data.entries));
          if (data.profile) {
            localStorage.setItem(`btb_profile_${currentUser}`, JSON.stringify(data.profile));
          }
          if (data.privacy) {
            localStorage.setItem(`btb_privacy_${currentUser}`, JSON.stringify(data.privacy));
          }
          alert('Data imported successfully! Refresh to see changes.');
          location.reload();
        }
      } catch (err) {
        alert('Error reading file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
});
