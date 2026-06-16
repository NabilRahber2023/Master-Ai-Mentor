import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { hashPassword } from '@better-auth/utils/password';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load frontend .env.local if available
import { config } from 'dotenv';
config({ path: path.join(__dirname, '..', '.env.local') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
console.log('Connecting to:', dbUrl.replace(/:[^@]*@/, ':****@'));

const pool = new Pool({ connectionString: dbUrl });

const email = 'oxford@gmail.com';
const password = '@oxford123#';

(async () => {
  try {
    const hashed = await hashPassword(password);
    console.log('Computed hash:', hashed.slice(0, 20) + '...');
    const client = await pool.connect();
    try {
      const res = await client.query(`UPDATE account SET password=$1 WHERE account_id=$2 AND provider_id='credential' RETURNING id, account_id, password`, [hashed, email]);
      if (res.rowCount === 0) {
        console.error('No account row updated. Verify account exists.');
        process.exit(1);
      }
      console.log('Updated account:', res.rows[0]);
    } finally {
      client.release();
    }
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error updating hash:', err);
    process.exit(1);
  }
})();
