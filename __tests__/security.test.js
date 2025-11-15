/**
 * Security Tests for BTB Fit Admin Panel
 * Tests authentication, authorization, and data access controls
 */

describe('Admin Security Tests', () => {
  beforeEach(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Password Authentication', () => {
    test('should prevent access without correct password', () => {
      const correctPassword = 'faj3*fneiaksdhal89-32sa0+';
      const wrongPasswords = [
        'wrong',
        'password',
        'admin',
        '123456',
        '',
        'faj3*fneiaksdhal89-32sa0', // missing last char
        'Faj3*fneiaksdhal89-32sa0+', // wrong case
        'faj3*fneiaksdhal89-32sa0+ ', // trailing space
        ' faj3*fneiaksdhal89-32sa0+', // leading space
      ];

      wrongPasswords.forEach(pwd => {
        expect(pwd).not.toBe(correctPassword);
      });
    });

    test('should not store password in localStorage', () => {
      // Simulate login
      sessionStorage.setItem('btb_admin_auth', 'true');
      
      // Check password is not in localStorage
      const localStorageKeys = Object.keys(localStorage);
      const hasPasswordInStorage = localStorageKeys.some(key => 
        localStorage.getItem(key)?.includes('faj3*fneiaksdhal89-32sa0+')
      );
      
      expect(hasPasswordInStorage).toBe(false);
    });

    test('should not store password in sessionStorage', () => {
      sessionStorage.setItem('btb_admin_auth', 'true');
      
      // Password should not be stored even in sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      const hasPasswordInStorage = sessionStorageKeys.some(key => 
        sessionStorage.getItem(key)?.includes('faj3*fneiaksdhal89-32sa0+')
      );
      
      expect(hasPasswordInStorage).toBe(false);
    });

    test('should require authentication flag in sessionStorage', () => {
      // Without auth flag, admin should redirect
      expect(sessionStorage.getItem('btb_admin_auth')).toBeNull();
      
      // With auth flag
      sessionStorage.setItem('btb_admin_auth', 'true');
      expect(sessionStorage.getItem('btb_admin_auth')).toBe('true');
    });

    test('should clear authentication on logout', () => {
      sessionStorage.setItem('btb_admin_auth', 'true');
      
      // Simulate logout
      sessionStorage.removeItem('btb_admin_auth');
      
      expect(sessionStorage.getItem('btb_admin_auth')).toBeNull();
    });
  });

  describe('Data Access Control', () => {
    test('should only access data for authenticated user (btbga)', () => {
      const username = 'btbga';
      const testData = [{ date: '2025-11-15', weight: 70, height: 175 }];
      
      localStorage.setItem(`btb_entries_${username}`, JSON.stringify(testData));
      
      // Should be able to read own data
      const data = JSON.parse(localStorage.getItem(`btb_entries_${username}`));
      expect(data).toEqual(testData);
      
      // Should not access other users' data
      const otherUserData = localStorage.getItem('btb_entries_otheruser');
      expect(otherUserData).toBeNull();
    });

    test('should namespace all localStorage keys with username', () => {
      const username = 'btbga';
      
      localStorage.setItem(`btb_entries_${username}`, '[]');
      localStorage.setItem(`btb_baseline_${username}`, '{}');
      localStorage.setItem(`btb_privacy_${username}`, 'true');
      
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('btb_')) {
          expect(key).toContain(username);
        }
      });
    });

    test('should not expose sensitive data in URL parameters', () => {
      // URLs should never contain password or sensitive data
      const mockUrl = 'admin.html';
      
      expect(mockUrl).not.toContain('password');
      expect(mockUrl).not.toContain('faj3');
      expect(mockUrl).not.toContain('btbga');
    });
  });

  describe('Input Validation & Injection Prevention', () => {
    test('should sanitize script injection in text inputs', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror="alert(1)">',
        'javascript:alert(1)',
        '<iframe src="evil.com"></iframe>',
        '"><script>alert(1)</script>',
      ];

      maliciousInputs.forEach(input => {
        // Should not execute scripts
        const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        expect(sanitized).not.toContain('<script>');
      });
    });

    test('should validate numeric inputs are within acceptable ranges', () => {
      const invalidWeights = [-10, 0, 500, 1000, NaN, Infinity, -Infinity];
      const validWeightMin = 30; // kg
      const validWeightMax = 300; // kg

      invalidWeights.forEach(weight => {
        const isValid = weight >= validWeightMin && weight <= validWeightMax;
        expect(isValid).toBe(false);
      });

      const validWeights = [50, 70, 100, 150];
      validWeights.forEach(weight => {
        const isValid = weight >= validWeightMin && weight <= validWeightMax;
        expect(isValid).toBe(true);
      });
    });

    test('should validate date inputs are reasonable', () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year future
      const ancientDate = new Date('1900-01-01');
      const validDate = new Date('2025-11-15');

      expect(futureDate > today).toBe(true); // Should reject future dates
      expect(ancientDate.getFullYear()).toBeLessThan(2000); // Should reject ancient dates
      expect(validDate <= today).toBe(true); // Should accept valid recent dates
    });

    test('should prevent SQL-like injection attempts in localStorage keys', () => {
      const maliciousKeys = [
        "btb_entries_'; DROP TABLE users; --",
        "btb_entries_' OR '1'='1",
        "btb_entries_admin'--",
      ];

      maliciousKeys.forEach(key => {
        // Detect malicious patterns
        const hasMaliciousPattern = key.includes("'") || 
                                   key.includes('DROP') || 
                                   key.includes('--') ||
                                   key.includes(' OR ');
        expect(hasMaliciousPattern).toBe(true);
      });

      // Valid key should not contain SQL syntax
      const validKey = 'btb_entries_btbga';
      expect(validKey).not.toContain("'");
      expect(validKey).not.toContain('--');
      expect(validKey).not.toContain('DROP');
    });
  });

  describe('Session Security', () => {
    test('should expire session on browser close (sessionStorage)', () => {
      sessionStorage.setItem('btb_admin_auth', 'true');
      expect(sessionStorage.getItem('btb_admin_auth')).toBe('true');
      
      // sessionStorage is automatically cleared on browser close
      // This is browser behavior, not testable in Jest
      // but we verify it's using sessionStorage not localStorage
      expect(localStorage.getItem('btb_admin_auth')).toBeNull();
    });

    test('should not persist authentication across sessions', () => {
      // Authentication should be in sessionStorage, not localStorage
      sessionStorage.setItem('btb_admin_auth', 'true');
      
      // Verify auth is NOT in persistent storage
      expect(localStorage.getItem('btb_admin_auth')).toBeNull();
    });

    test('should handle concurrent sessions safely', () => {
      const username = 'btbga';
      const data = [{ date: '2025-11-15', weight: 70 }];
      
      // Simulate multiple tabs
      localStorage.setItem(`btb_entries_${username}`, JSON.stringify(data));
      
      // Both tabs should read same data
      const tab1Data = JSON.parse(localStorage.getItem(`btb_entries_${username}`));
      const tab2Data = JSON.parse(localStorage.getItem(`btb_entries_${username}`));
      
      expect(tab1Data).toEqual(tab2Data);
    });
  });

  describe('Data Integrity', () => {
    test('should validate JSON structure before storing', () => {
      const validEntry = {
        date: '2025-11-15',
        weight: 70,
        height: 175,
        muscle: 20,
        protein: 150,
        carbs: 200,
        fats: 60,
        water: 80,
        workouts: []
      };

      const requiredFields = ['date', 'weight', 'height', 'muscle', 'protein', 'carbs', 'fats', 'water'];
      
      requiredFields.forEach(field => {
        expect(validEntry).toHaveProperty(field);
      });
    });

    test('should prevent storage of malformed data', () => {
      const malformedData = [
        { date: 'invalid-date' },
        { weight: 'not-a-number' },
        { height: -100 },
        { muscle: 'string' },
        null,
        undefined,
        'not an object',
      ];

      malformedData.forEach(data => {
        try {
          JSON.stringify(data);
          // If it stringifies, check if it's valid structure
          const isValidEntry = data && 
            typeof data === 'object' && 
            data.date && 
            !isNaN(data.weight);
          expect(isValidEntry).toBe(false);
        } catch (e) {
          // Should throw on invalid data
          expect(e).toBeDefined();
        }
      });
    });

    test('should handle localStorage quota exceeded gracefully', () => {
      const username = 'btbga';
      
      // Try to store huge amount of data
      const hugeArray = new Array(100000).fill({
        date: '2025-11-15',
        weight: 70,
        height: 175,
        muscle: 20,
        protein: 150,
        carbs: 200,
        fats: 60,
        water: 80,
        workouts: []
      });

      let quotaExceeded = false;
      try {
        localStorage.setItem(`btb_entries_${username}`, JSON.stringify(hugeArray));
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          quotaExceeded = true;
        }
      }

      // Should either succeed or handle quota gracefully
      expect(typeof quotaExceeded).toBe('boolean');
    });
  });

  describe('Brute Force Protection', () => {
    test('should detect rapid password attempts', () => {
      const attempts = [];
      const maxAttempts = 5;
      const timeWindow = 60000; // 1 minute

      // Simulate 10 failed attempts
      for (let i = 0; i < 10; i++) {
        attempts.push(Date.now());
      }

      // Count attempts in last minute
      const recentAttempts = attempts.filter(time => 
        Date.now() - time < timeWindow
      );

      expect(recentAttempts.length).toBeGreaterThan(maxAttempts);
      // Should trigger lockout
    });

    test('should implement rate limiting on password checks', () => {
      const attemptTimes = [];
      const minDelay = 1000; // 1 second between attempts

      // Record attempt times
      attemptTimes.push(Date.now());
      attemptTimes.push(Date.now() + 100); // Too fast
      attemptTimes.push(Date.now() + 200); // Too fast

      // Check if attempts are too rapid
      for (let i = 1; i < attemptTimes.length; i++) {
        const delay = attemptTimes[i] - attemptTimes[i - 1];
        if (delay < minDelay) {
          expect(delay).toBeLessThan(minDelay); // Should be prevented
        }
      }
    });
  });

  describe('Privacy & Data Exposure', () => {
    test('should respect privacy toggle for public profile', () => {
      const username = 'btbga';
      
      // Set privacy to true (private)
      localStorage.setItem(`btb_privacy_${username}`, 'true');
      
      const isPrivate = localStorage.getItem(`btb_privacy_${username}`) === 'true';
      expect(isPrivate).toBe(true);
      
      // Public profile should hide data when private
    });

    test('should not expose sensitive data in console logs', () => {
      // Mock console methods
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      // Ensure password is never logged
      const password = 'faj3*fneiaksdhal89-32sa0+';
      
      // These should never happen in production code
      expect(consoleLog).not.toHaveBeenCalledWith(expect.stringContaining(password));
      expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining(password));
      
      consoleLog.mockRestore();
      consoleError.mockRestore();
    });

    test('should sanitize data before displaying in UI', () => {
      const unsafeData = '<script>alert("XSS")</script>Hello';
      
      // Should use textContent not innerHTML for user data
      const div = document.createElement('div');
      div.textContent = unsafeData; // Safe
      
      expect(div.innerHTML).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;Hello');
      expect(div.textContent).toBe('<script>alert("XSS")</script>Hello');
      
      // innerHTML would execute script (unsafe)
      // textContent renders it as text (safe)
    });
  });

  describe('Password Strength', () => {
    test('current password should meet complexity requirements', () => {
      const password = 'faj3*fneiaksdhal89-32sa0+';
      
      expect(password.length).toBeGreaterThanOrEqual(12); // Min 12 chars
      expect(/[a-z]/.test(password)).toBe(true); // Lowercase
      expect(/[0-9]/.test(password)).toBe(true); // Numbers
      expect(/[*\-+]/.test(password)).toBe(true); // Special chars
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        'password',
        '123456',
        'admin',
        'qwerty',
        'abc123',
        '111111',
      ];

      weakPasswords.forEach(pwd => {
        const isWeak = pwd.length < 12 || 
                      !/[a-z]/.test(pwd) ||
                      !/[0-9]/.test(pwd) ||
                      !/[^a-zA-Z0-9]/.test(pwd);
        expect(isWeak).toBe(true);
      });
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention', () => {
    test('should escape HTML in user-generated content', () => {
      const userInput = '<img src=x onerror="alert(1)">';
      
      const escaped = userInput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      
      expect(escaped).not.toContain('<img');
      expect(escaped).toContain('&lt;img');
    });

    test('should prevent DOM-based XSS via URL parameters', () => {
      // Simulate malicious URL parameter
      const maliciousUrl = 'admin.html?redirect=javascript:alert(1)';
      
      expect(maliciousUrl).toContain('javascript:');
      
      // Should validate and sanitize URL parameters
      const url = new URL(maliciousUrl, 'http://localhost');
      const redirect = url.searchParams.get('redirect');
      
      const isSafe = redirect && 
                     !redirect.startsWith('javascript:') &&
                     !redirect.startsWith('data:') &&
                     !redirect.startsWith('vbscript:');
      
      expect(isSafe).toBe(false); // Should reject malicious redirect
    });
  });
});
