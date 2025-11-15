const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Import API routes
const verifyPassword = require('./api/verify-password');
const saveData = require('./api/save-data');
const loadData = require('./api/load-data');

// API routes
app.post('/api/verify-password', (req, res) => verifyPassword.default(req, res));
app.post('/api/save-data', (req, res) => saveData.default(req, res));
app.post('/api/load-data', (req, res) => loadData.default(req, res));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'settings.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
