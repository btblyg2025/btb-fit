const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    if (!password) {
      console.log('No password provided');
      return res.status(400).json({ error: 'Password is required' });
    }

    // Get the password hash from environment variable
    const passwordHash = process.env.PASSWORD_HASH;

    if (!passwordHash) {
      console.log('PASSWORD_HASH not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Password length:', password.length);
    console.log('Hash length:', passwordHash.length);

    // Compare the provided password with the hash
    const isValid = await bcrypt.compare(password, passwordHash);
    
    console.log('Password valid:', isValid);

    if (isValid) {
      // Generate a simple session token
      const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
      
      return res.status(200).json({ 
        valid: true, 
        token: token 
      });
    } else {
      return res.status(401).json({ valid: false });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
