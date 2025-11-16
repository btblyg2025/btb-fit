const { loadData } = require('../db');

module.exports = async function handler(req, res) {
  console.log('🔵 [load-privacy] Request received:', req.method);
  
  // Allow GET requests for public access
  if (req.method !== 'GET' && req.method !== 'POST') {
    console.log('❌ [load-privacy] Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // No authentication required for loading public privacy settings
    const username = 'btbga';
    console.log('🔵 [load-privacy] Loading privacy for user:', username);
    
    const privacySettings = await loadData(username, 'privacy');
    console.log('🔵 [load-privacy] Database result:', privacySettings ? 'FOUND' : 'NOT FOUND');
    
    if (privacySettings) {
      console.log('🔵 [load-privacy] Privacy data:', JSON.stringify(privacySettings));
    }
    
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
    
    const finalData = privacySettings || defaultSettings;
    console.log('🔵 [load-privacy] Returning:', JSON.stringify(finalData));
    
    return res.status(200).json({ 
      data: finalData
    });
  } catch (error) {
    console.error('❌ [load-privacy] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
