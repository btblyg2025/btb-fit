# BTB.fit Testing Documentation

## Automated Unit Testing

### Test Coverage Summary
- **Total Tests:** 51 unit tests
- **Test Pass Rate:** 100% (51/51 passing)
- **Test Framework:** Jest 30.2.0 with jsdom
- **Coverage Focus:** Core utility functions and business logic

### Test Suites

#### 1. **Utils Tests** (`__tests__/utils.test.js`) - 13 tests
- ✅ Date formatting (YYYY-MM-DD format with padding)
- ✅ BMI calculation (normal, underweight, overweight cases)
- ✅ Athleticism score calculation  
- ✅ BMI categorization (underweight/normal/overweight/obese)

#### 2. **Validation Tests** (`__tests__/validation.test.js`) - 17 tests
- ✅ Weight validation (20-500kg range, lb conversion)
- ✅ Height validation (50-300cm range, decimal support)
- ✅ Muscle percentage validation (5-70% range)
- ✅ Entry limit enforcement (365 max, allows replacement)
- ✅ Duplicate date detection

#### 3. **Storage Tests** (`__tests__/storage.test.js`) - 9 tests
- ✅ localStorage save/load operations
- ✅ Corrupted data handling
- ✅ Unit preference persistence (kg/lb)
- ✅ Privacy settings (public/private profiles)

#### 4. **Export/Import Tests** (`__tests__/export-import.test.js`) - 12 tests
- ✅ JSON export structure validation
- ✅ Import data validation
- ✅ Malformed JSON handling
- ✅ Data integrity preservation
- ✅ Filename format generation

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Manual Testing Checklist

### ✅ Admin Page (`admin.html`)

#### Authentication
- [ ] Password gate displays on page load
- [ ] Correct password (`faj3*fneiaksdhal89-32sa0+`) unlocks page
- [ ] Incorrect password shows error alert
- [ ] Empty password shows error alert

#### Data Entry
- [ ] All 8 input fields present (date, weight, height, muscle, water, protein, carbs, fats)
- [ ] Weight validation prevents < 20kg or > 500kg
- [ ] Height validation prevents < 50cm or > 300cm  
- [ ] Muscle validation prevents < 5% or > 70%
- [ ] Water validation prevents < 0oz or > 300oz
- [ ] Macro validation (protein/carbs/fats) prevents negative values
- [ ] Date picker sets to today by default
- [ ] Add Entry button saves data to localStorage
- [ ] Duplicate date warning appears with confirmation dialog
- [ ] Entry limit warning at 365 entries
- [ ] Data persists after page refresh

#### Unit Conversion
- [ ] kg/lb toggle switch works
- [ ] lb to kg conversion on save (165 lb ≈ 74.84 kg)
- [ ] Unit preference saved to localStorage
- [ ] Prompt to clear weight field when switching units

#### Charts
- [ ] Weight chart displays with line graph
- [ ] Muscle% chart displays
- [ ] BMI chart displays with color zones
- [ ] Athleticism score chart displays
- [ ] Water intake chart displays with filled area
- [ ] Macros chart displays with 3 lines (protein/carbs/fats)
- [ ] All charts use responsive canvas sizing
- [ ] Charts update immediately after adding entry

#### Export/Import
- [ ] Export button downloads JSON file
- [ ] Filename format: `btbfit_export_YYYY-MM-DD.json`
- [ ] Export blocked when no entries exist
- [ ] Import file input accepts .json files
- [ ] Valid JSON imports successfully
- [ ] Invalid JSON shows error
- [ ] Import count confirmation appears

#### Navigation
- [ ] "View Public Profile" button navigates to index.html
- [ ] Back button returns to admin page

### ✅ Public Profile Page (`index.html`)

#### Display
- [ ] Profile loads without password
- [ ] Logo and name display correctly
- [ ] Tagline displays
- [ ] All 6 charts render (read-only)
- [ ] Latest stats display if data exists
- [ ] Handles missing data gracefully (empty state)

#### Privacy
- [ ] Public profile setting respected
- [ ] Private profiles don't expose data
- [ ] No edit capabilities on public page

#### Data Integrity
- [ ] Reads from same localStorage key as admin
- [ ] Charts match admin page exactly
- [ ] No data modification possible

### Browser Compatibility Testing

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (iOS/Android)
- [ ] Mobile Safari (iOS)

### Performance Testing

- [ ] Page loads in < 2 seconds
- [ ] Charts render in < 1 second
- [ ] No console errors
- [ ] localStorage operations complete < 100ms
- [ ] Export/import completes in < 500ms

### Security Testing

- [ ] Password not visible in source code (check browser devtools)
- [ ] localStorage data not accessible from other domains
- [ ] No XSS vulnerabilities in user input
- [ ] Admin page requires password on every session

## Test Results

| Category | Status | Notes |
|----------|--------|-------|
| Unit Tests | ✅ PASS | 51/51 tests passing |
| Data Entry | ⏳ PENDING | Awaiting manual browser test |
| Charts | ⏳ PENDING | Awaiting Chart.js CDN validation |
| Export/Import | ⏳ PENDING | Awaiting file download test |
| Password Auth | ⏳ PENDING | Awaiting browser test |
| Mobile Responsive | ⏳ PENDING | Awaiting device test |

## Known Issues

None currently identified.

## Future Test Enhancements

1. **End-to-End Testing**: Implement Playwright/Cypress for full browser automation
2. **Visual Regression**: Add screenshot comparison tests
3. **Accessibility**: Add WCAG 2.1 compliance tests
4. **Performance**: Add Lighthouse CI integration
5. **Integration Tests**: Test actual Chart.js rendering with headless browser

---

**Last Updated:** November 14, 2025  
**Test Framework:** Jest 30.2.0  
**Test Environment:** Node.js 24.8.0  
**Coverage Tool:** Istanbul/NYC
