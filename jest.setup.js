// Mock localStorage with a proper storage object
let store = {};

const localStorageMock = {
  getItem: jest.fn((key) => store[key] || null),
  setItem: jest.fn((key, value) => {
    store[key] = value.toString();
  }),
  removeItem: jest.fn((key) => {
    delete store[key];
  }),
  clear: jest.fn(() => {
    store = {};
  }),
};

global.localStorage = localStorageMock;

// Mock alert, confirm, and prompt
global.alert = jest.fn();
global.confirm = jest.fn(() => true);
global.prompt = jest.fn();

// Mock URL methods
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(function(ctx, config) {
  this.data = config.data;
  this.options = config.options;
  this.type = config.type;
  this.destroy = jest.fn();
  this.update = jest.fn();
  return this;
});

// Reset mocks before each test
beforeEach(() => {
  store = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  alert.mockClear();
  confirm.mockClear();
  prompt.mockClear();
  Chart.mockClear();
});
