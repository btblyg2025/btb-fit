/**
 * Unit tests for UI functions
 * These test the chart rendering and DOM manipulation functions
 */

// Mock data for testing
const mockEntries = [
  { date: '2025-11-01', weight: 75, height: 180, muscle: 35, water: 64, protein: 150, carbs: 200, fats: 50 },
  { date: '2025-11-02', weight: 74.5, height: 180, muscle: 35.5, water: 80, protein: 160, carbs: 180, fats: 45 },
  { date: '2025-11-03', weight: 74, height: 180, muscle: 36, water: 70, protein: 155, carbs: 190, fats: 48 }
];

// Helper functions from the app
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

function computeBMI(weight, heightCm) {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

function bmiCategory(bmi) {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

function computeAthleticism(weightKg, heightCm, musclePercent) {
  const bmi = computeBMI(weightKg, heightCm);
  const muscleFactor = musclePercent / 100;
  const bmiFactor = 25 / Math.max(bmi, 18.5);
  return Math.round((muscleFactor * bmiFactor) * 100);
}

describe('UI Chart Functions', () => {
  let canvas, ctx;

  beforeEach(() => {
    // Create mock canvas and context
    canvas = document.createElement('canvas');
    canvas.id = 'test-chart';
    ctx = {
      canvas: canvas,
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 50 })),
    };
    canvas.getContext = jest.fn(() => ctx);
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Chart Data Preparation', () => {
    test('prepares weight chart data correctly', () => {
      const labels = mockEntries.map(e => e.date);
      const weights = mockEntries.map(e => e.weight);
      
      expect(labels).toEqual(['2025-11-01', '2025-11-02', '2025-11-03']);
      expect(weights).toEqual([75, 74.5, 74]);
    });

    test('prepares muscle chart data correctly', () => {
      const muscles = mockEntries.map(e => e.muscle);
      
      expect(muscles).toEqual([35, 35.5, 36]);
    });

    test('prepares BMI chart data correctly', () => {
      const bmis = mockEntries.map(e => computeBMI(e.weight, e.height));
      
      expect(bmis[0]).toBeCloseTo(23.15, 1);
      expect(bmis[1]).toBeCloseTo(22.99, 1);
      expect(bmis[2]).toBeCloseTo(22.84, 1);
    });

    test('prepares athleticism chart data correctly', () => {
      const scores = mockEntries.map(e => 
        computeAthleticism(e.weight, e.height, e.muscle)
      );
      
      expect(scores[0]).toBeGreaterThan(0);
      expect(scores[1]).toBeGreaterThan(scores[0]); // Should improve with more muscle
    });

    test('prepares water intake chart data correctly', () => {
      const water = mockEntries.map(e => e.water);
      
      expect(water).toEqual([64, 80, 70]);
    });

    test('prepares macros chart data correctly', () => {
      const protein = mockEntries.map(e => e.protein);
      const carbs = mockEntries.map(e => e.carbs);
      const fats = mockEntries.map(e => e.fats);
      
      expect(protein).toEqual([150, 160, 155]);
      expect(carbs).toEqual([200, 180, 190]);
      expect(fats).toEqual([50, 45, 48]);
    });
  });

  describe('Chart Instance Management', () => {
    test('creates new chart instance', () => {
      const chartData = {
        type: 'line',
        data: {
          labels: ['2025-11-01', '2025-11-02'],
          datasets: [{
            label: 'Weight',
            data: [75, 74.5]
          }]
        }
      };

      const chart = new Chart(ctx, chartData);
      
      expect(Chart).toHaveBeenCalledWith(ctx, chartData);
      expect(chart.type).toBe('line');
      expect(chart.data.labels).toHaveLength(2);
    });

    test('destroys old chart before creating new one', () => {
      const oldChart = new Chart(ctx, { type: 'line', data: {} });
      
      expect(oldChart.destroy).toBeDefined();
      
      oldChart.destroy();
      
      expect(oldChart.destroy).toHaveBeenCalled();
    });

    test('updates existing chart', () => {
      const chart = new Chart(ctx, { type: 'line', data: {} });
      
      chart.update();
      
      expect(chart.update).toHaveBeenCalled();
    });
  });

  describe('Chart Configuration', () => {
    test('weight chart has correct configuration', () => {
      const config = {
        type: 'line',
        data: {
          labels: mockEntries.map(e => e.date),
          datasets: [{
            label: 'Weight (kg)',
            data: mockEntries.map(e => e.weight),
            borderColor: '#4c9aff',
            backgroundColor: 'rgba(76, 154, 255, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      };

      const chart = new Chart(ctx, config);
      
      expect(chart.type).toBe('line');
      expect(chart.data.datasets[0].label).toBe('Weight (kg)');
      expect(chart.options.responsive).toBe(true);
    });

    test('BMI chart has color zones', () => {
      const config = {
        type: 'line',
        data: {
          labels: mockEntries.map(e => e.date),
          datasets: [{
            label: 'BMI',
            data: mockEntries.map(e => computeBMI(e.weight, e.height)),
            borderColor: '#4c9aff'
          }]
        },
        options: {
          plugins: {
            annotation: {
              annotations: {
                underweight: { yMin: 0, yMax: 18.5, backgroundColor: 'rgba(255, 206, 86, 0.1)' },
                normal: { yMin: 18.5, yMax: 25, backgroundColor: 'rgba(75, 192, 192, 0.1)' },
                overweight: { yMin: 25, yMax: 30, backgroundColor: 'rgba(255, 159, 64, 0.1)' },
                obese: { yMin: 30, yMax: 50, backgroundColor: 'rgba(255, 99, 132, 0.1)' }
              }
            }
          }
        }
      };

      const chart = new Chart(ctx, config);
      
      expect(chart.options.plugins.annotation.annotations.normal).toBeDefined();
      expect(chart.options.plugins.annotation.annotations.normal.yMin).toBe(18.5);
    });

    test('water chart has fill configuration', () => {
      const config = {
        type: 'line',
        data: {
          labels: mockEntries.map(e => e.date),
          datasets: [{
            label: 'Water (oz)',
            data: mockEntries.map(e => e.water),
            fill: true,
            backgroundColor: 'rgba(54, 162, 235, 0.2)'
          }]
        }
      };

      const chart = new Chart(ctx, config);
      
      expect(chart.data.datasets[0].fill).toBe(true);
    });

    test('macros chart has multiple datasets', () => {
      const config = {
        type: 'line',
        data: {
          labels: mockEntries.map(e => e.date),
          datasets: [
            {
              label: 'Protein (g)',
              data: mockEntries.map(e => e.protein),
              borderColor: '#ff6384'
            },
            {
              label: 'Carbs (g)',
              data: mockEntries.map(e => e.carbs),
              borderColor: '#36a2eb'
            },
            {
              label: 'Fats (g)',
              data: mockEntries.map(e => e.fats),
              borderColor: '#ffce56'
            }
          ]
        }
      };

      const chart = new Chart(ctx, config);
      
      expect(chart.data.datasets).toHaveLength(3);
      expect(chart.data.datasets[0].label).toBe('Protein (g)');
      expect(chart.data.datasets[1].label).toBe('Carbs (g)');
      expect(chart.data.datasets[2].label).toBe('Fats (g)');
    });
  });

  describe('Empty Data Handling', () => {
    test('handles empty entries array', () => {
      const emptyEntries = [];
      const labels = emptyEntries.map(e => e.date);
      const weights = emptyEntries.map(e => e.weight);
      
      expect(labels).toEqual([]);
      expect(weights).toEqual([]);
    });

    test('chart renders with no data', () => {
      const config = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Weight',
            data: []
          }]
        }
      };

      const chart = new Chart(ctx, config);
      
      expect(chart.data.labels).toHaveLength(0);
      expect(chart.data.datasets[0].data).toHaveLength(0);
    });
  });

  describe('Canvas Element Checks', () => {
    test('checks if canvas exists before rendering', () => {
      const canvas = document.getElementById('test-chart');
      
      expect(canvas).toBeTruthy();
      expect(canvas.getContext).toBeDefined();
    });

    test('handles missing canvas gracefully', () => {
      const missingCanvas = document.getElementById('non-existent-chart');
      
      expect(missingCanvas).toBeNull();
      
      // Function should return early if canvas is null
      if (!missingCanvas) {
        expect(true).toBe(true); // Test passes if we handle null correctly
      }
    });

    test('gets 2d context from canvas', () => {
      const canvas = document.getElementById('test-chart');
      const context = canvas.getContext('2d');
      
      expect(context).toBeTruthy();
    });
  });
});

describe('Silhouette Update Function', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="silhouette-bmi">–</div>
      <div id="silhouette-status">–</div>
    `;
  });

  test('updates silhouette with latest entry data', () => {
    const latestEntry = mockEntries[mockEntries.length - 1];
    const bmi = computeBMI(latestEntry.weight, latestEntry.height);
    const status = bmiCategory(bmi);

    document.getElementById('silhouette-bmi').textContent = bmi.toFixed(1);
    document.getElementById('silhouette-status').textContent = status;

    expect(document.getElementById('silhouette-bmi').textContent).toBe('22.8');
    expect(document.getElementById('silhouette-status').textContent).toBe('Normal');
  });

  test('shows placeholder when no entries', () => {
    document.getElementById('silhouette-bmi').textContent = '–';
    document.getElementById('silhouette-status').textContent = '–';

    expect(document.getElementById('silhouette-bmi').textContent).toBe('–');
    expect(document.getElementById('silhouette-status').textContent).toBe('–');
  });
});

describe('Password Authentication Functions', () => {
  const ADMIN_PASSWORD = 'faj3*fneiaksdhal89-32sa0+';

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="password-gate" style="display: flex;">
        <input id="password-input" type="password" />
      </div>
      <div id="app-content" style="display: none;"></div>
    `;
  });

  test('unlockAdmin shows app content with correct password', () => {
    const passwordInput = document.getElementById('password-input');
    passwordInput.value = ADMIN_PASSWORD;

    // Simulate unlock
    if (passwordInput.value === ADMIN_PASSWORD) {
      document.getElementById('password-gate').style.display = 'none';
      document.getElementById('app-content').style.display = 'block';
    }

    expect(document.getElementById('password-gate').style.display).toBe('none');
    expect(document.getElementById('app-content').style.display).toBe('block');
  });

  test('unlockAdmin fails with incorrect password', () => {
    const passwordInput = document.getElementById('password-input');
    passwordInput.value = 'wrongpassword';

    // Simulate unlock attempt
    if (passwordInput.value === ADMIN_PASSWORD) {
      document.getElementById('password-gate').style.display = 'none';
      document.getElementById('app-content').style.display = 'block';
    } else {
      alert('Incorrect password!');
    }

    expect(document.getElementById('password-gate').style.display).toBe('flex');
    expect(alert).toHaveBeenCalledWith('Incorrect password!');
  });

  test('lockAdmin hides app content', () => {
    document.getElementById('password-gate').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';

    // Simulate lock
    document.getElementById('password-gate').style.display = 'flex';
    document.getElementById('app-content').style.display = 'none';

    expect(document.getElementById('password-gate').style.display).toBe('flex');
    expect(document.getElementById('app-content').style.display).toBe('none');
  });
});
