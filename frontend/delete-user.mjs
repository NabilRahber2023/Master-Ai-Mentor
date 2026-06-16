import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
const pool = new Pool({ connectionString: dbUrl });

async function deleteUser() {
  try {
    const client = await pool.connect();
    
    await client.query('DELETE FROM "account" WHERE account_id = $1', ['oxford@gmail.com']);
    await client.query('DELETE FROM "user" WHERE email = $1', ['oxford@gmail.com']);
    
    console.log('✅ Old user deleted');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteUser();
