const { saveData } = require('../db');

module.exports = async function handler(req, res) {
  console.log('🟢 [save-privacy] Request received:', req.method);
  
  if (req.method !== 'POST') {
    console.log('❌ [save-privacy] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, privacySettings } = req.body;
    console.log('🟢 [save-privacy] Token present:', !!token);
    console.log('🟢 [save-privacy] Privacy settings:', JSON.stringify(privacySettings));

    if (!token || !privacySettings) {
      console.log('❌ [save-privacy] Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, we'll use a simple token validation
    // In production, you'd want proper JWT validation
    if (!token) {
      console.log('❌ [save-privacy] Unauthorized');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Save to PostgreSQL database
    const username = 'btbga'; // Could extract from token in production
    console.log('🟢 [save-privacy] Saving to database for user:', username);
    
    await saveData(username, 'privacy', privacySettings);
    
    console.log('✅ [save-privacy] Successfully saved privacy settings');
    
    return res.status(200).json({ 
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [save-privacy] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
