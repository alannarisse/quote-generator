require('dotenv').config();
const pool = require('./pool');

async function testConnection() {
  console.log('Testing database connection...');
  try {
    const res = await pool.query('SELECT count(*) as count FROM quotes');
    console.log('✅ Connected successfully to database!');
    console.log(`📊 Found ${res.rows[0].count} quotes in the database.`);
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error(err.message);
    if (err.message.includes('ENOTFOUND')) {
      console.error('\n💡 Tip: Check your DATABASE_URL in backend/.env.');
      console.error('If using Railway, make sure to use the public proxy URL (e.g. *.proxy.rlwy.net) rather than *.railway.internal when running locally.');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
