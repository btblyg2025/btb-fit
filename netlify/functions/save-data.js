const { getStore } = require('@netlify/blobs');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, dataType, data } = JSON.parse(event.body);
    
    // Verify auth token exists
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    // Get the Netlify Blobs store
    const store = getStore('btb-fitness-data');
    
    // Store data with user-specific key
    const userId = 'btbga'; // Your username
    const key = `${userId}_${dataType}`; // e.g., btbga_entries, btbga_baseline, btbga_profile
    
    await store.set(key, JSON.stringify(data));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `${dataType} saved successfully`,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Save data error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data', details: error.message })
    };
  }
};
