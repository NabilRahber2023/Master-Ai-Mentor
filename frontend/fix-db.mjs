import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
const pool = new Pool({ connectionString: dbUrl });

async function fixDb() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Adding impersonated_by to session if not exists...');
    await client.query('ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "impersonated_by" TEXT;');
    
    console.log('✅ Column added successfully!');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
}

fixDb();
