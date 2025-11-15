const express = require('express');
const path = require('path');
const { initDB } = require('./db');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Disable caching for HTML files
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/' || req.path === '/admin' || req.path === '/settings' || req.path === '/profile') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(__dirname));

// Initialize database
initDB().catch(err => console.error('Failed to initialize database:', err));

// Import API routes
const verifyPassword = require('./api/verify-password');
const saveData = require('./api/save-data');
const loadData = require('./api/load-data');

// API routes
app.post('/api/verify-password', verifyPassword);
app.post('/api/save-data', saveData);
app.post('/api/load-data', loadData);

// Serve HTML files
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'leaderboard.html'));
});

app.get('/tracker', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/settings', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/profile', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'profile.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PASSWORD_HASH is ${process.env.PASSWORD_HASH ? 'SET' : 'NOT SET'}`);
  if (process.env.PASSWORD_HASH) {
    console.log(`PASSWORD_HASH length: ${process.env.PASSWORD_HASH.length}`);
  }
});
