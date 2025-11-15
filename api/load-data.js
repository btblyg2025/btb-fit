const { loadData } = require('../db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, dataType } = req.body;

    if (!token || !dataType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Load from PostgreSQL database
    const username = 'btbga'; // Could extract from token in production
    const data = await loadData(username, dataType);
    
    console.log(`Loaded ${dataType} from database for ${username}:`, data ? 'found' : 'not found');
    
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Load error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
