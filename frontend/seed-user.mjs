import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { user, account } from './db/schema/auth-schema.ts';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '.env.local') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
console.log('Connecting to:', dbUrl.replace(/:[^@]*@/, ':****@'));

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle({ client: pool });

async function seedUser() {
  try {
    const email = 'oxford@gmail.com';
    const password = '@oxford123#';
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const accountId = uuidv4();

    console.log('Creating user...');
    
    // Insert user
    await db.insert(user).values({
      id: userId,
      name: 'Oxford User',
      email: email,
      emailVerified: true,
      role: 'guest',
      banned: false,
    });

    console.log('User created:', userId);

    // Insert account with hashed password
    await db.insert(account).values({
      id: accountId,
      accountId: email,
      providerId: 'credential',
      userId: userId,
      password: hashedPassword,
    });

    console.log('Account created with email:', email);
    console.log('✅ User seeded successfully!');
    console.log('Email:', email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding user:', error);
    process.exit(1);
  }
}

seedUser();
