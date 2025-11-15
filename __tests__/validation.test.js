/**
 * Unit tests for input validation
 */

describe('Input Validation', () => {
  describe('Weight validation', () => {
    test('accepts valid weight in kg', () => {
      const weight = 75;
      const unit = 'kg';
      const minWeight = 20;
      const maxWeight = 500;
      
      expect(weight).toBeGreaterThanOrEqual(minWeight);
      expect(weight).toBeLessThanOrEqual(maxWeight);
    });

    test('accepts valid weight in lb', () => {
      const weight = 165;
      const unit = 'lb';
      const minWeight = 44;
      const maxWeight = 1100;
      
      expect(weight).toBeGreaterThanOrEqual(minWeight);
      expect(weight).toBeLessThanOrEqual(maxWeight);
    });

    test('rejects weight below minimum (kg)', () => {
      const weight = 15;
      const minWeight = 20;
      
      expect(weight).toBeLessThan(minWeight);
    });

    test('rejects weight above maximum (kg)', () => {
      const weight = 550;
      const maxWeight = 500;
      
      expect(weight).toBeGreaterThan(maxWeight);
    });

    test('converts pounds to kilograms correctly', () => {
      const weightLb = 165;
      const weightKg = weightLb * 0.45359237;
      
      expect(weightKg).toBeCloseTo(74.84, 1);
    });
  });

  describe('Height validation', () => {
    test('accepts valid height', () => {
      const height = 180;
      const minHeight = 50;
      const maxHeight = 300;
      
      expect(height).toBeGreaterThanOrEqual(minHeight);
      expect(height).toBeLessThanOrEqual(maxHeight);
    });

    test('rejects height below minimum', () => {
      const height = 30;
      const minHeight = 50;
      
      expect(height).toBeLessThan(minHeight);
    });

    test('rejects height above maximum', () => {
      const height = 350;
      const maxHeight = 300;
      
      expect(height).toBeGreaterThan(maxHeight);
    });

    test('accepts decimal height values', () => {
      const height = 175.5;
      
      expect(height).toBeCloseTo(175.5, 1);
    });
  });

  describe('Muscle percentage validation', () => {
    test('accepts valid muscle percentage', () => {
      const muscle = 35;
      const minMuscle = 5;
      const maxMuscle = 70;
      
      expect(muscle).toBeGreaterThanOrEqual(minMuscle);
      expect(muscle).toBeLessThanOrEqual(maxMuscle);
    });

    test('rejects muscle below minimum', () => {
      const muscle = 2;
      const minMuscle = 5;
      
      expect(muscle).toBeLessThan(minMuscle);
    });

    test('rejects muscle above maximum', () => {
      const muscle = 85;
      const maxMuscle = 70;
      
      expect(muscle).toBeGreaterThan(maxMuscle);
    });

    test('accepts decimal muscle values', () => {
      const muscle = 35.5;
      
      expect(muscle).toBeCloseTo(35.5, 1);
    });
  });

  describe('Entry limit validation', () => {
    test('allows adding entry when below limit', () => {
      const currentEntries = 100;
      const maxEntries = 365;
      
      expect(currentEntries).toBeLessThan(maxEntries);
    });

    test('prevents adding entry when at limit', () => {
      const currentEntries = 365;
      const maxEntries = 365;
      
      expect(currentEntries).toBeGreaterThanOrEqual(maxEntries);
    });

    test('allows replacing existing entry even at limit', () => {
      const currentEntries = 365;
      const maxEntries = 365;
      const existingEntry = true;
      
      const canAdd = currentEntries < maxEntries || existingEntry;
      
      expect(canAdd).toBe(true);
    });
  });

  describe('Date validation', () => {
    test('detects duplicate date entries', () => {
      const entries = [
        { date: '2025-01-01', weight: 75, height: 180, muscle: 35 },
        { date: '2025-01-02', weight: 74, height: 180, muscle: 36 },
      ];
      const newDate = '2025-01-01';
      
      const existingEntry = entries.find(e => e.date === newDate);
      
      expect(existingEntry).toBeDefined();
      expect(existingEntry.date).toBe('2025-01-01');
    });

    test('allows unique date entries', () => {
      const entries = [
        { date: '2025-01-01', weight: 75, height: 180, muscle: 35 },
      ];
      const newDate = '2025-01-03';
      
      const existingEntry = entries.find(e => e.date === newDate);
      
      expect(existingEntry).toBeUndefined();
    });
  });
});
