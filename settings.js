// Settings page script for btb.fit

const ADMIN_PASSWORD = 'faj3*fneiaksdhal89-32sa0+';
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
  } catch (e) {
    console.error('Failed to save baseline stats:', e);
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

// Initialize settings
function initSettings() {
  loadUserProfile();
  loadPrivacySettings();
  
  // Populate profile form
  document.getElementById('display-name-input').value = userProfile.displayName || '';
  
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
  document.getElementById('app').classList.add('hidden');
  document.getElementById('password-modal').style.display = 'flex';
  document.getElementById('password-input').value = '';
  document.getElementById('error-message').style.display = 'none';
}

// On DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Password form handler
  document.getElementById('password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password-input').value;
    if (password === ADMIN_PASSWORD) {
      unlockSettings();
    } else {
      document.getElementById('error-message').style.display = 'block';
    }
  });

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
    
    // Convert weight to kg for storage
    const weightKg = weightUnit === 'lb' ? weightInput / 2.20462 : weightInput;
    
    // Convert height to cm
    const totalInches = (heightFt * 12) + heightIn;
    const heightCm = totalInches * 2.54;
    
    const baseline = {
      age: age,
      weight: weightKg,
      weightDisplay: weightInput,
      weightUnit: weightUnit,
      height: heightCm,
      muscle: muscle
    };
    
    saveBaselineStats(baseline);
    alert('Baseline stats saved successfully!');
  });

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
    
    alert('Profile saved successfully!');
  });

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
  document.getElementById('privacy-projections').addEventListener('change', (e) => {
    privacySettings.projections = e.target.checked;
    savePrivacySettings();
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
