// Settings page script for btb.fit

const ADMIN_USER = 'btbga';

let currentUser = ADMIN_USER;
let userProfile = {
  displayName: ''
};
let privacySettings = {
  silhouette: true,
  bmi: true,
  progress: true,
  athleticism: true,
  water: true,
  macros: true
};
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

// Lock baseline fields
function lockBaselineFields() {
  document.getElementById('baseline-age-input').readOnly = true;
  document.getElementById('baseline-weight-input').readOnly = true;
  document.getElementById('baseline-weight-unit').disabled = true;
  document.getElementById('baseline-height-ft').readOnly = true;
  document.getElementById('baseline-height-in').readOnly = true;
  document.getElementById('baseline-muscle-input').readOnly = true;
  document.getElementById('baseline-body-fat-input').readOnly = true;
  document.getElementById('baseline-body-water-input').readOnly = true;
  document.getElementById('baseline-bone-mass-input').readOnly = true;
  document.getElementById('baseline-bmr-input').readOnly = true;
  
  const submitBtn = document.querySelector('#baseline-form button[type="submit"]');
  const editBtn = document.getElementById('edit-baseline-btn');
  if (submitBtn) submitBtn.style.display = 'none';
  if (editBtn) editBtn.style.display = 'inline-block';
}

// Unlock baseline fields
function unlockBaselineFields() {
  document.getElementById('baseline-age-input').readOnly = false;
  document.getElementById('baseline-weight-input').readOnly = false;
  document.getElementById('baseline-weight-unit').disabled = false;
  document.getElementById('baseline-height-ft').readOnly = false;
  document.getElementById('baseline-height-in').readOnly = false;
  document.getElementById('baseline-muscle-input').readOnly = false;
  document.getElementById('baseline-body-fat-input').readOnly = false;
  document.getElementById('baseline-body-water-input').readOnly = false;
  document.getElementById('baseline-bone-mass-input').readOnly = false;
  document.getElementById('baseline-bmr-input').readOnly = false;
  
  const submitBtn = document.querySelector('#baseline-form button[type="submit"]');
  const editBtn = document.getElementById('edit-baseline-btn');
  if (submitBtn) submitBtn.style.display = 'inline-block';
  if (editBtn) editBtn.style.display = 'none';
}

// Lock profile fields
function lockProfileFields() {
  document.getElementById('display-name-input').readOnly = true;
  
  const submitBtn = document.querySelector('#profile-form button[type="submit"]');
  const editBtn = document.getElementById('edit-profile-btn');
  if (submitBtn) submitBtn.style.display = 'none';
  if (editBtn) editBtn.style.display = 'inline-block';
}

// Unlock profile fields
function unlockProfileFields() {
  document.getElementById('display-name-input').readOnly = false;
  
  const submitBtn = document.querySelector('#profile-form button[type="submit"]');
  const editBtn = document.getElementById('edit-profile-btn');
  if (submitBtn) submitBtn.style.display = 'inline-block';
  if (editBtn) editBtn.style.display = 'none';
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
    const totalInches = baseline.height / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    heightEl.textContent = `${feet}'${inches}"`;
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
  
  console.log('Display update complete');
}

// Lock baseline fields
function lockBaselineFields() {
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

// Initialize settings
function initSettings() {
  loadUserProfile();
  loadPrivacySettings();
  
  // Update the saved data display
  updateSavedDataDisplay();
  
  // Populate profile form
  document.getElementById('display-name-input').value = userProfile.displayName || '';
  
  // Lock profile field if display name exists
  if (userProfile.displayName) {
    lockProfileFields();
  }
  
  // Set privacy toggle states
  document.getElementById('privacy-silhouette').checked = privacySettings.silhouette;
  document.getElementById('privacy-bmi').checked = privacySettings.bmi;
  document.getElementById('privacy-progress').checked = privacySettings.progress;
  document.getElementById('privacy-athleticism').checked = privacySettings.athleticism;
  document.getElementById('privacy-water').checked = privacySettings.water;
  document.getElementById('privacy-macros').checked = privacySettings.macros;
}

// Show settings interface
function unlockSettings() {
  isAuthenticated = true;
  document.getElementById('password-modal').style.display = 'none';
  document.getElementById('app').classList.remove('hidden');
  initSettings();
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

  // Load baseline stats if available
  const baseline = loadBaselineStats();
  if (baseline) {
    if (baseline.age !== undefined) {
      document.getElementById('baseline-age-input').value = baseline.age;
    }
    if (baseline.weight) {
      document.getElementById('baseline-weight-input').value = baseline.weightDisplay;
      document.getElementById('baseline-weight-unit').value = baseline.weightUnit || 'lb';
    }
    if (baseline.height) {
      const totalInches = baseline.height / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = (totalInches % 12).toFixed(1);
      document.getElementById('baseline-height-ft').value = feet;
      document.getElementById('baseline-height-in').value = inches;
    }
    if (baseline.muscle !== undefined) {
      document.getElementById('baseline-muscle-input').value = baseline.muscle;
    }
    if (baseline.bodyFat !== undefined) {
      document.getElementById('baseline-body-fat-input').value = baseline.bodyFat;
    }
    if (baseline.bodyWater !== undefined) {
      document.getElementById('baseline-body-water-input').value = baseline.bodyWater;
    }
    if (baseline.boneMass !== undefined) {
      // Convert from kg to lb for display
      const boneMassLb = baseline.boneMass * 2.20462;
      document.getElementById('baseline-bone-mass-input').value = boneMassLb.toFixed(1);
    }
    if (baseline.bmr !== undefined) {
      document.getElementById('baseline-bmr-input').value = baseline.bmr;
    }
    
    // Lock baseline fields and show edit button
    lockBaselineFields();
  }

  // Baseline stats form handler
  document.getElementById('baseline-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const age = parseInt(document.getElementById('baseline-age-input').value);
    const weightInput = parseFloat(document.getElementById('baseline-weight-input').value);
    const weightUnit = document.getElementById('baseline-weight-unit').value;
    const heightFt = parseFloat(document.getElementById('baseline-height-ft').value);
    const heightIn = parseFloat(document.getElementById('baseline-height-in').value);
    const muscle = parseFloat(document.getElementById('baseline-muscle-input').value);
    const bodyFat = parseFloat(document.getElementById('baseline-body-fat-input').value);
    const bodyWater = parseFloat(document.getElementById('baseline-body-water-input').value);
    let boneMass = parseFloat(document.getElementById('baseline-bone-mass-input').value);
    const bmr = parseFloat(document.getElementById('baseline-bmr-input').value);
    
    // Convert weight to kg for storage
    const weightKg = weightUnit === 'lb' ? weightInput / 2.20462 : weightInput;
    
    // Convert height to cm
    const totalInches = (heightFt * 12) + heightIn;
    const heightCm = totalInches * 2.54;
    
    // Convert bone mass from lb to kg if provided
    if (!isNaN(boneMass)) {
      boneMass = boneMass * 0.45359237;
    }
    
    const baseline = {
      age: age,
      weight: weightKg,
      weightDisplay: weightInput,
      weightUnit: weightUnit,
      height: heightCm,
      muscle: isNaN(muscle) ? undefined : muscle,
      bodyFat: isNaN(bodyFat) ? undefined : bodyFat,
      bodyWater: isNaN(bodyWater) ? undefined : bodyWater,
      boneMass: isNaN(boneMass) ? undefined : boneMass,
      bmr: isNaN(bmr) ? undefined : bmr
    };
    
    saveBaselineStats(baseline);
    console.log('Baseline saved, now updating display...');
    
    // Repopulate fields with saved values
    document.getElementById('baseline-age-input').value = baseline.age;
    document.getElementById('baseline-weight-input').value = baseline.weightDisplay;
    document.getElementById('baseline-weight-unit').value = baseline.weightUnit;
    const totalInchesDisplay = baseline.height / 2.54;
    const feetDisplay = Math.floor(totalInchesDisplay / 12);
    const inchesDisplay = (totalInchesDisplay % 12).toFixed(1);
    document.getElementById('baseline-height-ft').value = feetDisplay;
    document.getElementById('baseline-height-in').value = inchesDisplay;
    if (baseline.muscle !== undefined) {
      document.getElementById('baseline-muscle-input').value = baseline.muscle;
    }
    if (baseline.bodyFat !== undefined) {
      document.getElementById('baseline-body-fat-input').value = baseline.bodyFat;
    }
    if (baseline.bodyWater !== undefined) {
      document.getElementById('baseline-body-water-input').value = baseline.bodyWater;
    }
    if (baseline.boneMass !== undefined) {
      const boneMassLb = baseline.boneMass * 2.20462;
      document.getElementById('baseline-bone-mass-input').value = boneMassLb.toFixed(1);
    }
    if (baseline.bmr !== undefined) {
      document.getElementById('baseline-bmr-input').value = baseline.bmr;
    }
    
    baselineEditMode = false;
    lockBaselineFields();
    
    // Update the display at the top - directly
    const ageDisplay = document.getElementById('age-display');
    if (ageDisplay) {
      ageDisplay.textContent = baseline.age + ' years';
      ageDisplay.style.color = '#34e27c';
    }
    
    const heightDisplay = document.getElementById('height-display');
    if (heightDisplay) {
      const totalIn = baseline.height / 2.54;
      const ft = Math.floor(totalIn / 12);
      const inches = Math.round(totalIn % 12);
      heightDisplay.textContent = `${ft}'${inches}"`;
      heightDisplay.style.color = '#34e27c';
    }
    
    const weightDisplay = document.getElementById('weight-display');
    if (weightDisplay) {
      weightDisplay.textContent = `${baseline.weightDisplay} ${baseline.weightUnit}`;
      weightDisplay.style.color = '#34e27c';
    }
    
    const muscleDisplay = document.getElementById('muscle-display');
    if (muscleDisplay && baseline.muscle) {
      muscleDisplay.textContent = baseline.muscle + '%';
      muscleDisplay.style.color = '#34e27c';
    }
    
    const bodyFatDisplay = document.getElementById('body-fat-display');
    if (bodyFatDisplay && baseline.bodyFat) {
      bodyFatDisplay.textContent = baseline.bodyFat + '%';
      bodyFatDisplay.style.color = '#34e27c';
    }
    
    alert('Baseline stats saved successfully!');
    console.log('Saved baseline:', baseline);
  });
  
  // Add edit baseline button if it doesn't exist
  const baselineForm = document.getElementById('baseline-form');
  if (!document.getElementById('edit-baseline-btn')) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'edit-baseline-btn';
    editBtn.className = 'btn secondary';
    editBtn.textContent = 'Edit Baseline';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', () => {
      baselineEditMode = true;
      unlockBaselineFields();
    });
    baselineForm.querySelector('.form-footer').appendChild(editBtn);
  }

  // Profile form handler
  document.getElementById('profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const displayName = document.getElementById('display-name-input').value.trim();
    
    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    userProfile.displayName = displayName;
    saveUserProfile();
    syncToCloud('profile', userProfile);
    
    // Repopulate field with saved value
    document.getElementById('display-name-input').value = displayName;
    
    // Update display directly
    const displayNameEl = document.getElementById('display-name-display');
    if (displayNameEl) {
      displayNameEl.textContent = displayName;
      displayNameEl.style.color = '#34e27c';
    }
    
    profileEditMode = false;
    lockProfileFields();
    
    alert('Profile saved successfully!');
    console.log('Saved profile:', userProfile);
  });
  
  // Add edit profile button if it doesn't exist
  const profileForm = document.getElementById('profile-form');
  if (!document.getElementById('edit-profile-btn')) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'edit-profile-btn';
    editBtn.className = 'btn secondary';
    editBtn.textContent = 'Edit Name';
    editBtn.style.display = 'none';
    editBtn.addEventListener('click', () => {
      profileEditMode = true;
      unlockProfileFields();
    });
    profileForm.querySelector('.form-footer').appendChild(editBtn);
  }

  // Privacy toggle event listeners
  document.getElementById('privacy-silhouette').addEventListener('change', (e) => {
    privacySettings.silhouette = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
  });
  document.getElementById('privacy-bmi').addEventListener('change', (e) => {
    privacySettings.bmi = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
  });
  document.getElementById('privacy-progress').addEventListener('change', (e) => {
    privacySettings.progress = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
  });
  document.getElementById('privacy-athleticism').addEventListener('change', (e) => {
    privacySettings.athleticism = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
  });
  document.getElementById('privacy-water').addEventListener('change', (e) => {
    privacySettings.water = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
  });
  document.getElementById('privacy-macros').addEventListener('change', (e) => {
    privacySettings.macros = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
  });
  document.getElementById('privacy-projections').addEventListener('change', (e) => {
    privacySettings.projections = e.target.checked;
    savePrivacySettings();
    syncToCloud('privacy', privacySettings);
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
