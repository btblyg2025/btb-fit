const { loadData } = require('../db');

module.exports = async function handler(req, res) {
  // Allow GET requests for public access
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // No authentication required for loading public privacy settings
    const username = 'btbga';
    const privacySettings = await loadData(username, 'privacy');
    
    console.log(`Loaded privacy settings from database for ${username}:`, privacySettings ? 'found' : 'not found');
    
    // Return default settings if none found
    const defaultSettings = {
      silhouette: true,
      bmi: true,
      progress: true,
      athleticism: true,
      water: true,
      macros: true,
      bodyComp: true,
      projections: true
    };
    
    return res.status(200).json({ 
      data: privacySettings || defaultSettings 
    });
  } catch (error) {
    console.error('Load privacy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
