const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
  // Only allow POST (to include auth token)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { token, dataType } = JSON.parse(event.body);
    
    // Verify auth token exists
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    // Get the Netlify Blobs store
    const store = getStore('btb-fitness-data');
    
    // Load data with user-specific key
    const userId = 'btbga'; // Your username
    const key = `${userId}_${dataType}`;
    
    const dataString = await store.get(key);
    
    if (!dataString) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          data: null,
          message: 'No cloud data found'
        })
      };
    }
    
    const data = JSON.parse(dataString);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        data: data
      })
    };
  } catch (error) {
    console.error('Load data error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load data', details: error.message })
    };
  }
};
