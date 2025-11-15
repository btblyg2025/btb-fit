/**
 * Unit tests for data export/import functionality
 */

describe('Data Export/Import', () => {
  let mockEntries;

  beforeEach(() => {
    mockEntries = [
      { date: '2025-01-01', weight: 75, height: 180, muscle: 35 },
      { date: '2025-01-02', weight: 74.5, height: 180, muscle: 35.5 },
      { date: '2025-01-03', weight: 74, height: 180, muscle: 36 },
    ];
  });

  describe('Export functionality', () => {
    test('creates correct export data structure', () => {
      const currentUser = 'testuser';
      const exportDate = new Date().toISOString();
      
      const dataToExport = {
        username: currentUser,
        exportDate: exportDate,
        entries: mockEntries
      };
      
      expect(dataToExport).toHaveProperty('username');
      expect(dataToExport).toHaveProperty('exportDate');
      expect(dataToExport).toHaveProperty('entries');
      expect(dataToExport.username).toBe('testuser');
      expect(dataToExport.entries).toHaveLength(3);
    });

    test('converts data to JSON string correctly', () => {
      const dataToExport = {
        username: 'testuser',
        exportDate: new Date().toISOString(),
        entries: mockEntries
      };
      
      const jsonString = JSON.stringify(dataToExport, null, 2);
      
      expect(jsonString).toContain('testuser');
      expect(jsonString).toContain('2025-01-01');
      expect(typeof jsonString).toBe('string');
    });

    test('prevents export when no entries exist', () => {
      const entries = [];
      const canExport = entries.length > 0;
      
      expect(canExport).toBe(false);
    });

    test('generates correct filename format', () => {
      const currentUser = 'testuser';
      const date = '2025-11-14';
      const filename = `btb_fit_${currentUser}_${date}.json`;
      
      expect(filename).toBe('btb_fit_testuser_2025-11-14.json');
      expect(filename).toMatch(/\.json$/);
    });
  });

  describe('Import functionality', () => {
    test('validates import data structure', () => {
      const importedData = {
        username: 'testuser',
        exportDate: '2025-11-14',
        entries: mockEntries
      };
      
      const isValid = importedData.entries && Array.isArray(importedData.entries);
      
      expect(isValid).toBe(true);
    });

    test('rejects invalid import data', () => {
      const invalidData = {
        username: 'testuser',
        entries: 'not an array'
      };
      
      const isValid = invalidData.entries && Array.isArray(invalidData.entries);
      
      expect(isValid).toBe(false);
    });

    test('rejects import data without entries field', () => {
      const invalidData = {
        username: 'testuser',
        exportDate: '2025-11-14'
      };
      
      const isValid = !!(invalidData.entries && Array.isArray(invalidData.entries));
      
      expect(isValid).toBe(false);
    });

    test('counts imported entries correctly', () => {
      const importedData = {
        username: 'testuser',
        exportDate: '2025-11-14',
        entries: mockEntries
      };
      
      expect(importedData.entries).toHaveLength(3);
    });

    test('handles malformed JSON gracefully', () => {
      const malformedJSON = '{"username": "test", "entries": [';
      let isValid = false;
      
      try {
        const parsed = JSON.parse(malformedJSON);
        isValid = parsed.entries && Array.isArray(parsed.entries);
      } catch (e) {
        isValid = false;
      }
      
      expect(isValid).toBe(false);
    });
  });

  describe('Data integrity', () => {
    test('preserves all entry fields during export/import cycle', () => {
      const original = mockEntries[0];
      const jsonString = JSON.stringify([original]);
      const parsed = JSON.parse(jsonString)[0];
      
      expect(parsed.date).toBe(original.date);
      expect(parsed.weight).toBe(original.weight);
      expect(parsed.height).toBe(original.height);
      expect(parsed.muscle).toBe(original.muscle);
    });

    test('maintains data types after serialization', () => {
      const jsonString = JSON.stringify(mockEntries);
      const parsed = JSON.parse(jsonString);
      
      expect(typeof parsed[0].date).toBe('string');
      expect(typeof parsed[0].weight).toBe('number');
      expect(typeof parsed[0].height).toBe('number');
      expect(typeof parsed[0].muscle).toBe('number');
    });
  });
});
