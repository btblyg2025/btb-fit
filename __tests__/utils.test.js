/**
 * Unit tests for utility functions in btb.fit
 */

describe('Utility Functions', () => {
  describe('formatDate', () => {
    test('formats date correctly as YYYY-MM-DD', () => {
      const date = new Date(2025, 2, 15); // Month is 0-indexed
      const formatted = formatDate(date);
      expect(formatted).toBe('2025-03-15');
    });

    test('pads single digit months and days', () => {
      const date = new Date(2025, 0, 5); // Month is 0-indexed
      const formatted = formatDate(date);
      expect(formatted).toBe('2025-01-05');
    });
  });

  describe('computeBMI', () => {
    test('calculates BMI correctly for normal values', () => {
      const bmi = computeBMI(75, 180);
      expect(bmi).toBeCloseTo(23.15, 1);
    });

    test('calculates BMI for underweight person', () => {
      const bmi = computeBMI(50, 180);
      expect(bmi).toBeCloseTo(15.43, 1);
    });

    test('calculates BMI for overweight person', () => {
      const bmi = computeBMI(95, 170);
      expect(bmi).toBeCloseTo(32.87, 1);
    });

    test('handles decimal inputs', () => {
      const bmi = computeBMI(72.5, 175.5);
      expect(bmi).toBeCloseTo(23.54, 1);
    });
  });

  describe('computeAthleticism', () => {
    test('calculates athleticism score correctly', () => {
      const score = computeAthleticism(75, 180, 35);
      // muscle (35) - (BMI - 22) = 35 - (23.15 - 22) = 33.85
      expect(score).toBeCloseTo(33.85, 1);
    });

    test('higher muscle mass increases score', () => {
      const score1 = computeAthleticism(75, 180, 30);
      const score2 = computeAthleticism(75, 180, 40);
      expect(score2).toBeGreaterThan(score1);
    });

    test('lower BMI increases score', () => {
      const score1 = computeAthleticism(80, 180, 35);
      const score2 = computeAthleticism(70, 180, 35);
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('bmiCategory', () => {
    test('categorizes underweight correctly', () => {
      expect(bmiCategory(17)).toBe('Underweight');
      expect(bmiCategory(18.4)).toBe('Underweight');
    });

    test('categorizes normal weight correctly', () => {
      expect(bmiCategory(18.5)).toBe('Normal');
      expect(bmiCategory(22)).toBe('Normal');
      expect(bmiCategory(24.9)).toBe('Normal');
    });

    test('categorizes overweight correctly', () => {
      expect(bmiCategory(25)).toBe('Overweight');
      expect(bmiCategory(27)).toBe('Overweight');
      expect(bmiCategory(29.9)).toBe('Overweight');
    });

    test('categorizes obese correctly', () => {
      expect(bmiCategory(30)).toBe('Obese');
      expect(bmiCategory(35)).toBe('Obese');
      expect(bmiCategory(40)).toBe('Obese');
    });
  });
});

// Helper function to make these available in tests
// In real implementation, we'd export these from script.js
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

function computeBMI(weight, heightCm) {
  const heightMeters = heightCm / 100;
  return weight / (heightMeters * heightMeters);
}

function computeAthleticism(weightKg, heightCm, musclePercent) {
  const bmi = computeBMI(weightKg, heightCm);
  return musclePercent - (bmi - 22);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}
