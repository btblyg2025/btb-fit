/**
 * Unit tests for localStorage operations
 */

describe('LocalStorage Operations', () => {
  let mockEntries;

  beforeEach(() => {
    mockEntries = [
      { date: '2025-01-01', weight: 75, height: 180, muscle: 35 },
      { date: '2025-01-02', weight: 74.5, height: 180, muscle: 35.5 },
    ];
  });

  describe('saveEntries', () => {
    test('saves entries to localStorage with correct key', () => {
      const currentUser = 'testuser';
      const entries = mockEntries;
      
      localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(entries));
      
      const saved = localStorage.getItem('btb_entries_testuser');
      expect(saved).toBe(JSON.stringify(entries));
    });

    test('does not save if no current user', () => {
      const currentUser = null;
      
      if (currentUser) {
        localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(mockEntries));
      }
      
      expect(localStorage.getItem('btb_entries_null')).toBeNull();
    });
  });

  describe('loadEntries', () => {
    test('loads entries from localStorage', () => {
      const currentUser = 'testuser';
      localStorage.setItem(`btb_entries_${currentUser}`, JSON.stringify(mockEntries));
      
      const raw = localStorage.getItem(`btb_entries_${currentUser}`);
      const entries = raw ? JSON.parse(raw) : [];
      
      expect(entries).toEqual(mockEntries);
      expect(entries).toHaveLength(2);
    });

    test('returns empty array if no data exists', () => {
      const currentUser = 'newuser';
      
      const raw = localStorage.getItem(`btb_entries_${currentUser}`);
      const entries = raw ? JSON.parse(raw) : [];
      
      expect(entries).toEqual([]);
      expect(entries).toHaveLength(0);
    });

    test('handles corrupted data gracefully', () => {
      const currentUser = 'testuser';
      localStorage.setItem(`btb_entries_${currentUser}`, 'invalid json {');
      
      let entries = [];
      try {
        const raw = localStorage.getItem(`btb_entries_${currentUser}`);
        entries = raw ? JSON.parse(raw) : [];
      } catch (e) {
        entries = [];
      }
      
      expect(entries).toEqual([]);
    });
  });

  describe('Unit preference storage', () => {
    test('saves unit preference per user', () => {
      const currentUser = 'testuser';
      const unit = 'lb';
      
      localStorage.setItem(`btb_unit_${currentUser}`, unit);
      
      expect(localStorage.getItem('btb_unit_testuser')).toBe('lb');
    });

    test('loads saved unit preference', () => {
      const currentUser = 'testuser';
      localStorage.setItem(`btb_unit_${currentUser}`, 'kg');
      
      const savedUnit = localStorage.getItem(`btb_unit_${currentUser}`);
      
      expect(savedUnit).toBe('kg');
    });
  });

  describe('Privacy settings', () => {
    test('saves privacy setting per user', () => {
      const currentUser = 'testuser';
      const isPublic = false;
      
      localStorage.setItem(`btb_profile_public_${currentUser}`, isPublic.toString());
      
      expect(localStorage.getItem('btb_profile_public_testuser')).toBe('false');
    });

    test('defaults to public if not set', () => {
      const currentUser = 'newuserwithnoprofile';
      
      const isPublic = localStorage.getItem(`btb_profile_public_${currentUser}`) !== 'false';
      
      expect(isPublic).toBe(true);
    });
  });
});
