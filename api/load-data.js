module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, dataType } = req.body;

    if (!token || !dataType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // For now, return null (no cloud data)
    // Vercel KV would be: const data = await kv.get(`btbga_${dataType}`);
    
    return res.status(200).json({ data: null });
  } catch (error) {
    console.error('Load error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
