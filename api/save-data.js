const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, dataType, data } = req.body;

    if (!token || !dataType || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, we'll use a simple token validation
    // In production, you'd want proper JWT validation
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Store in Vercel KV if available, otherwise just return success
    // You'll need to set up Vercel KV storage separately
    const key = `btbga_${dataType}`;
    
    // For now, we'll just acknowledge the save
    // Vercel KV would be: await kv.set(key, JSON.stringify(data));
    
    return res.status(200).json({ 
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
