import { readFileSync } from 'fs';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
const pool = new Pool({ connectionString: dbUrl });

async function createTables() {
  try {
    const sqlFile = path.join(__dirname, 'create-auth-tables.sql');
    const sql = readFileSync(sqlFile, 'utf-8');
    
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Creating auth tables...');
    await client.query(sql);
    
    console.log('✅ Auth tables created successfully!');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
