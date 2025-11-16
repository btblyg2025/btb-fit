# Card Data Requirements & Functionality Analysis
**Analysis Date:** November 16, 2025  
**Purpose:** Identify which cards display data, what data they need, and potential issues

---

## How to Test

### Quick Browser Console Test:
```javascript
// Check what data exists
console.log('Entries:', JSON.parse(localStorage.getItem('btb_entries_btbga') || '[]').length);
console.log('Baseline:', localStorage.getItem('btb_baseline_btbga'));
console.log('Profile:', localStorage.getItem('btb_profile_btbga'));

// See sample entry structure
const entries = JSON.parse(localStorage.getItem('btb_entries_btbga') || '[]');
console.log('Sample entry:', entries[0]);
```

---

## Card-by-Card Analysis

### ✅ **1. Silhouette Card** - NO CHART
**Required Data:**
- ✅ **Essential:** Latest entry with `weight`, `height`
- ⚠️ **Optional:** `muscle`/`musclePercent`, `bodyFat`, `water`, `carbs`, `protein`, `fats`

**What It Shows:**
- BMI calculation (requires weight + height)
- BMI Status category (Underweight/Normal/Overweight/Obese)
- Hydration status (requires `water` field)
- Nutrition status (requires `protein`, `carbs`, `fats`)
- Visual silhouette scaling based on BMI
- Visual brightness based on muscle%

**Potential Issues:**
- ⚠️ If no entries: Shows "–" for all fields
- ⚠️ Missing `water`: Shows "No Data" for hydration
- ⚠️ Missing macros: Shows "No Data" for nutrition
- ⚠️ Missing `muscle`: Silhouette brightness defaults to 1.0

**Entry Fields Used:**
```javascript
{
  weight: 75.5,        // REQUIRED (kg)
  height: 175,         // REQUIRED (cm)
  musclePercent: 42,   // Optional (%)
  water: 64,           // Optional (oz)
  protein: 150,        // Optional (g)
  carbs: 200,          // Optional (g)
  fats: 60             // Optional (g)
}
```

---

### ✅ **2. BMI Card** - LINE CHART
**Required Data:**
- ✅ **Essential:** All entries need `weight` and `height`

**What It Shows:**
- BMI trend over time
- Calculated as: `weight / (height_m²)`

**Potential Issues:**
- ❌ **BROKEN if:** Any entry missing `weight` or `height` → Chart shows NaN/Infinity
- ⚠️ Need at least 2 entries for trend to be meaningful

**Entry Fields Used:**
```javascript
{
  weight: 75.5,  // REQUIRED
  height: 175    // REQUIRED
}
```

---

### ✅ **3. Progress Card** - DUAL-AXIS LINE CHART
**Required Data:**
- ✅ **Essential:** All entries need `weight`
- ⚠️ **Optional:** `muscle` or `musclePercent`

**What It Shows:**
- Weight trend (kg or lb based on unit preference)
- Muscle% trend (secondary axis)

**Potential Issues:**
- ⚠️ Missing `muscle`/`musclePercent`: Second line shows flat at 0 or missing
- ⚠️ Weight shows but muscle line may be empty/misleading

**Entry Fields Used:**
```javascript
{
  weight: 75.5,      // REQUIRED
  muscle: 42,        // Optional (% or kg - code uses as %)
  musclePercent: 42  // Alternative to muscle
}
```

---

### ✅ **4. Athleticism Card** - LINE CHART
**Required Data:**
- ✅ **Essential:** All entries need `weight`, `height`, `muscle` or `musclePercent`

**What It Shows:**
- Athleticism Score = `musclePercent - (BMI - 22)`
- Higher score = more muscle for your BMI

**Potential Issues:**
- ❌ **BROKEN if:** Missing `muscle`/`musclePercent` → Returns `null`, chart uses `spanGaps: true` to skip
- ⚠️ Will show gaps in line where muscle data is missing

**Entry Fields Used:**
```javascript
{
  weight: 75.5,       // REQUIRED
  height: 175,        // REQUIRED
  musclePercent: 42   // REQUIRED (or 'muscle')
}
```

---

### ✅ **5. Water Card** - LINE CHART
**Required Data:**
- ⚠️ **Optional:** `water` field in entries

**What It Shows:**
- Daily water intake (oz)
- Filled area chart

**Potential Issues:**
- ⚠️ Missing `water`: Shows flat line at 0
- ⚠️ Can be misleading if data not tracked

**Entry Fields Used:**
```javascript
{
  water: 64  // Optional (oz), defaults to 0
}
```

---

### ✅ **6. Macros Card** - MULTI-LINE CHART
**Required Data:**
- ⚠️ **Optional:** `protein`, `carbs`, `fats`

**What It Shows:**
- 3 lines: Protein (red), Carbs (yellow), Fats (green)
- All in grams

**Potential Issues:**
- ⚠️ Missing macros: Shows flat lines at 0
- ⚠️ Can be misleading if not all tracked
- ⚠️ All three lines may overlap at 0

**Entry Fields Used:**
```javascript
{
  protein: 150,  // Optional (g), defaults to 0
  carbs: 200,    // Optional (g), defaults to 0
  fats: 60       // Optional (g), defaults to 0
}
```

---

### ⚠️ **7. Body Composition Card** - MULTI-LINE CHART
**Required Data:**
- ⚠️ **Optional:** At least one of: `muscle`/`musclePercent`, `bodyFat`, `bodyWater`, `boneMass`

**What It Shows:**
- Up to 3 lines: Muscle% (green), Body Fat% (red), Body Water% (blue)
- Y-axis: 0-100%

**Potential Issues:**
- ❌ **CHART DESTROYED if:** No entries have ANY body comp data
- ⚠️ Only shows lines for available data (good behavior)
- ⚠️ Uses `spanGaps: true` to handle missing values

**Entry Fields Used:**
```javascript
{
  muscle: 42,        // Optional (%) or musclePercent
  musclePercent: 42, // Alternative to muscle
  bodyFat: 15,       // Optional (%)
  bodyWater: 60      // Optional (%)
}
```

**Special Logic:**
```javascript
// Filters entries first
const entriesWithData = sorted.filter(e => 
  !isNaN(e.muscle) || !isNaN(e.musclePercent) || 
  !isNaN(e.bodyFat) || !isNaN(e.bodyWater) || !isNaN(e.boneMass)
);
if (entriesWithData.length === 0) {
  // Destroys chart and returns
  state.charts.bodyComp.destroy();
  return;
}
```

---

### ⚠️ **8. Projections Module** - NO CHART (TEXT DISPLAY)
**Required Data:**
- ✅ **Essential:** At least 2 entries with `weight` and `date`
- ⚠️ **Improves with:** `protein`, `carbs`, `fats`, `water`

**What It Shows:**
- Projected weight at 7, 15, 30, 180 days
- Based on weight loss rate + nutrition + hydration factors

**Potential Issues:**
- ❌ **DOESN'T SHOW if:** Less than 2 entries (early return)
- ⚠️ Without macros: Uses nutritionFactor = 1.0 (no adjustment)
- ⚠️ Without water: Uses hydrationFactor = 1.0 (no adjustment)
- ⚠️ Projects may be inaccurate without full data

**Entry Fields Used:**
```javascript
{
  date: '2025-11-16',  // REQUIRED
  weight: 75.5,        // REQUIRED
  protein: 150,        // Optional (improves accuracy)
  carbs: 200,          // Optional (improves accuracy)
  fats: 60,            // Optional (improves accuracy)
  water: 64            // Optional (improves accuracy)
}
```

---

### ❌ **9. Caloric Balance Card** - LINE CHART (NEW)
**Required Data:**
- ❌ **CRITICAL:** BMR value in baseline settings (`btb_baseline_btbga`)
- ⚠️ **Optional:** `protein`, `carbs`, `fats` in entries

**What It Shows:**
- BMR baseline (dashed line)
- Daily caloric intake (calculated from macros)
- Balance (intake - BMR)

**Potential Issues:**
- ❌ **COMPLETELY BROKEN if:** No BMR in baseline → Early return, no chart renders
- ⚠️ Missing macros in entries: Shows intake at 0, balance = -BMR
- ⚠️ Misleading if macros not tracked

**Baseline Data Required:**
```javascript
localStorage.setItem('btb_baseline_btbga', JSON.stringify({
  bmr: 1800  // REQUIRED (calories/day)
}));
```

**Entry Fields Used:**
```javascript
{
  protein: 150,  // Optional (g)
  carbs: 200,    // Optional (g)
  fats: 60       // Optional (g)
}
```

**Calculation:**
- Daily Intake = (protein × 4) + (carbs × 4) + (fats × 9)
- Balance = Daily Intake - BMR

---

### ✅ **10. Strength-to-Weight Ratio Card** - LINE CHART (NEW)
**Required Data:**
- ✅ **Essential:** All entries need `weight` and `muscle`/`musclePercent`

**What It Shows:**
- Ratio Score = (muscle% / weight) × 10
- Higher = better muscle efficiency per kg body weight

**Potential Issues:**
- ⚠️ Missing `muscle`/`musclePercent`: Shows 0 (misleading)
- ⚠️ Missing `weight`: Division by 0 protection (defaults to 1)
- ⚠️ Can be confusing if data incomplete

**Entry Fields Used:**
```javascript
{
  weight: 75.5,       // REQUIRED (kg)
  muscle: 42,         // REQUIRED (%)
  musclePercent: 42   // Alternative to muscle
}
```

**Formula:**
```javascript
const ratio = (muscle / weight) * 10;
// Example: 42% muscle / 75kg = 0.56 × 10 = 5.6
```

---

### ⚠️ **11. Body Recomposition Card** - MIXED CHART (NEW)
**Required Data:**
- ⚠️ **Optional:** `muscle`/`musclePercent` and `bodyFat`

**What It Shows:**
- Muscle% (green line)
- Body Fat% (red line)
- Recomp Score (yellow bars) = muscle gain + fat loss between entries

**Potential Issues:**
- ⚠️ Missing muscle/fat data: Lines show as null with `spanGaps: true`
- ⚠️ First entry always shows recomp score = 0 (no prior comparison)
- ⚠️ Needs consistent data for meaningful recomp scores

**Entry Fields Used:**
```javascript
{
  muscle: 42,        // Optional (%)
  musclePercent: 42, // Alternative
  bodyFat: 15        // Optional (%)
}
```

**Recomp Score Calculation:**
```javascript
// For each entry after first:
const muscleDelta = muscleData[i] - muscleData[i-1];
const fatDelta = fatData[i-1] - fatData[i];  // Reversed (fat loss is good)
const recompScore = muscleDelta + fatDelta;
// Example: +1% muscle, -0.5% fat → 1 + 0.5 = 1.5 (positive recomp)
```

---

### ✅ **12. Consistency Tracker Card** - BAR CHART + STATS (NEW)
**Required Data:**
- ✅ **Essential:** Entries with `date` field

**What It Shows:**
- Current streak (consecutive days with entries)
- Longest streak ever
- 30-day completion rate (%)
- Bar chart: Last 12 weeks entry frequency

**Potential Issues:**
- ⚠️ No entries: Shows all 0s
- ⚠️ Irregular entry dates: Streaks may break
- ⚠️ Today's date sensitivity: Streak calculation checks if latest entry is today or yesterday

**Entry Fields Used:**
```javascript
{
  date: '2025-11-16'  // REQUIRED (YYYY-MM-DD)
}
```

**Streak Logic:**
```javascript
// Checks gap between consecutive entries
const gap = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
if (gap === 1) {
  currentStreak++;  // Consecutive day
} else {
  // Streak broken
}
```

**Chart Color Coding:**
- 🟢 Green: 5+ entries per week (very consistent)
- 🟡 Yellow: 3-4 entries per week (moderately consistent)
- 🔴 Red: <3 entries per week (inconsistent)

---

### ⚠️ **13. Bone Density & BMR Card** - DUAL-AXIS CHART (NEW)
**Required Data:**
- ⚠️ **Falls back to baseline:** `boneMass` and/or `bmr` from baseline settings
- ⚠️ **Optional:** `boneMass` and `bmr` in entries (overrides baseline)

**What It Shows:**
- Bone Mass (lb) - converted from kg
- BMR (cal/day)
- Both as trends over time

**Potential Issues:**
- ⚠️ Without baseline OR entry data: Shows flat lines at 0
- ⚠️ Fallback behavior: Uses baseline if entry missing values
- ⚠️ Can be misleading if mixing baseline with sparse entry data

**Baseline Data (Fallback):**
```javascript
localStorage.setItem('btb_baseline_btbga', JSON.stringify({
  boneMass: 3.5,  // Optional (kg)
  bmr: 1800       // Optional (cal/day)
}));
```

**Entry Fields Used:**
```javascript
{
  boneMass: 3.5,  // Optional (kg), converted to lb for display
  bmr: 1850       // Optional (cal/day)
}
```

**Data Priority:**
```javascript
const boneMassKg = e.boneMass || baseline?.boneMass || 0;
const bmr = e.bmr || baseline?.bmr || 0;
```

---

## Summary Table

| Card # | Card Name | Status | Critical Data | Optional Data | Breaks Without Data? |
|--------|-----------|--------|---------------|---------------|---------------------|
| 1 | Silhouette | ✅ | weight, height | muscle, water, macros | ❌ No (shows "–") |
| 2 | BMI | ✅ | weight, height | - | ⚠️ Yes (NaN if missing) |
| 3 | Progress | ✅ | weight | muscle | ❌ No (partial data) |
| 4 | Athleticism | ⚠️ | weight, height, muscle | - | ⚠️ Partial (gaps in chart) |
| 5 | Water | ✅ | - | water | ❌ No (shows 0) |
| 6 | Macros | ✅ | - | protein, carbs, fats | ❌ No (shows 0) |
| 7 | Body Comp | ⚠️ | At least 1 body metric | muscle, fat, water | ✅ Yes (destroys chart) |
| 8 | Projections | ⚠️ | 2+ entries, weight, date | macros, water | ✅ Yes (no display) |
| 9 | Caloric Balance | ❌ | **BMR in baseline** | macros | ✅ **YES - BROKEN** |
| 10 | Strength-Weight | ⚠️ | weight, muscle | - | ❌ No (shows 0) |
| 11 | Recomposition | ⚠️ | - | muscle, bodyFat | ❌ No (empty chart) |
| 12 | Consistency | ✅ | date | - | ❌ No (shows 0s) |
| 13 | Bone & BMR | ⚠️ | - | boneMass, bmr (baseline or entry) | ❌ No (shows 0) |

---

## Critical Issues Found

### 🔴 **HIGH PRIORITY - Likely Broken**

1. **Caloric Balance Card (#9)**
   - ❌ **Requires BMR in baseline settings**
   - ❌ Early returns if no BMR → Chart never renders
   - **Fix:** Add BMR to baseline settings or remove early return

2. **Body Composition Card (#7)**
   - ⚠️ Destroys chart if NO body composition data at all
   - May be empty for users without smart scale data

3. **Projections Module (#8)**
   - ⚠️ Requires 2+ entries minimum
   - Won't show anything for new users

---

## Medium Priority - Potentially Misleading

4. **Strength-to-Weight (#10)**
   - Shows 0 if muscle data missing (looks like data exists but is bad)
   - Should maybe check for data first?

5. **Bone & BMR (#13)**
   - Flat lines at 0 without baseline
   - Users may not know to set baseline

6. **Recomposition (#11)**
   - Can show empty chart with all null values
   - First entry always 0 for recomp score

---

## Required Baseline Settings

**Currently Missing Check:**
```javascript
const baseline = JSON.parse(localStorage.getItem('btb_baseline_btbga') || '{}');
```

**Should Contain:**
```javascript
{
  bmr: 1800,        // CRITICAL for Caloric Balance card
  boneMass: 3.5,    // Optional for Bone & BMR card
  height: 175,      // May be used elsewhere
  age: 30,          // May be used for calculations
  gender: 'male'    // May be used for calculations
}
```

---

## Recommended Data Entry Structure

**Minimal Entry (Works for basic cards):**
```javascript
{
  date: '2025-11-16',
  weight: 75.5,
  height: 175
}
```

**Good Entry (Most cards work):**
```javascript
{
  date: '2025-11-16',
  weight: 75.5,
  height: 175,
  muscle: 42,
  water: 64,
  protein: 150,
  carbs: 200,
  fats: 60
}
```

**Complete Entry (All cards work):**
```javascript
{
  date: '2025-11-16',
  weight: 75.5,
  height: 175,
  muscle: 42,           // or musclePercent
  bodyFat: 15,
  bodyWater: 60,
  boneMass: 3.5,
  bmr: 1850,
  water: 64,
  protein: 150,
  carbs: 200,
  fats: 60
}
```

---

## Testing Checklist

To properly test each card, you need:

- [ ] **At least 2-3 entries** with dates
- [ ] **Baseline settings** with BMR value
- [ ] Entries with **weight** and **height** (required for BMI, Progress, Athleticism)
- [ ] Entries with **muscle%** (required for Athleticism, Strength-Weight, Recomposition)
- [ ] Entries with **macros** (protein, carbs, fats) for Macros, Caloric Balance, Projections
- [ ] Entries with **water** for Water card and Projections accuracy
- [ ] Entries with **bodyFat**, **bodyWater** for Body Composition
- [ ] Entries with **boneMass** for Bone & BMR (or use baseline)

---

## Next Steps

1. **Check Browser Console:**
   ```javascript
   // See what data you have
   console.log('Entries:', JSON.parse(localStorage.getItem('btb_entries_btbga') || '[]'));
   console.log('Baseline:', JSON.parse(localStorage.getItem('btb_baseline_btbga') || '{}'));
   ```

2. **Add Missing Baseline Data:**
   - Go to Admin → Settings → Baseline Settings
   - **ADD BMR VALUE** (critical for Caloric Balance)

3. **Check Entry Data Completeness:**
   - Look at existing entries
   - Identify which fields are missing
   - Decide which cards will actually work

4. **Consider Fixes:**
   - Add better "no data" messaging for cards
   - Remove early returns that break cards
   - Add data validation warnings in admin
