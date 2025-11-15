const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, data_type)
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_data_lookup 
      ON user_data(username, data_type);
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  } finally {
    client.release();
  }
}

// Save data to database
async function saveData(username, dataType, data) {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO user_data (username, data_type, data, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (username, data_type) 
      DO UPDATE SET data = $3, updated_at = CURRENT_TIMESTAMP
    `, [username, dataType, data]);
    return { success: true };
  } catch (error) {
    console.error('Save data error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Load data from database
async function loadData(username, dataType) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT data FROM user_data WHERE username = $1 AND data_type = $2',
      [username, dataType]
    );
    return result.rows.length > 0 ? result.rows[0].data : null;
  } catch (error) {
    console.error('Load data error:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { initDB, saveData, loadData, pool };
