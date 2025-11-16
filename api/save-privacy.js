const { saveData } = require('../db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, privacySettings } = req.body;

    if (!token || !privacySettings) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, we'll use a simple token validation
    // In production, you'd want proper JWT validation
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Save to PostgreSQL database
    const username = 'btbga'; // Could extract from token in production
    await saveData(username, 'privacy', privacySettings);
    
    console.log(`Saved privacy settings to database for ${username}`);
    
    return res.status(200).json({ 
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save privacy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
