const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { password } = JSON.parse(event.body);

    if (!password) {
      console.log('No password provided');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password is required' })
      };
    }

    // Get the password hash from environment variable
    const passwordHash = process.env.PASSWORD_HASH;

    if (!passwordHash) {
      console.log('PASSWORD_HASH not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    console.log('Password length:', password.length);
    console.log('Hash length:', passwordHash.length);
    console.log('Hash starts with:', passwordHash.substring(0, 10));

    // Compare the provided password with the hash
    const isValid = await bcrypt.compare(password, passwordHash);
    
    console.log('Password valid:', isValid);

    if (isValid) {
      // Generate a simple session token (you could use JWT for more security)
      const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          valid: true, 
          token: token 
        })
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ valid: false })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
