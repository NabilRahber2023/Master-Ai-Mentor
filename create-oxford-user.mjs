import bcrypt from 'bcryptjs';
import pg from 'pg';
import { randomUUID } from 'crypto';

const { Client } = pg;

const DB_CONFIG = {
  host: 'localhost',
  port: 5433,
  database: 'ai_mentor',
  user: 'postgres',
  password: 'postgres',
};

async function createOxfordUser() {
  const email = 'oxford@gmail.com';
  const password = '@oxford123#';
  
  console.log(`\n🔐 Creating Oxford Test User`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');
    
    // Check if user already exists
    const existingUser = await client.query(
      `SELECT id FROM "user" WHERE email = $1`,
      [email]
    );
    
    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`📝 User already exists: ${userId}`);
    } else {
      userId = `oxford-user-${randomUUID()}`;
      await client.query(
        `INSERT INTO "user" (id, name, email, "email_verified", role, "created_at", "updated_at")
         VALUES ($1, $2, $3, true, 'guest', NOW(), NOW())`,
        [userId, 'Oxford User', email]
      );
      console.log(`📝 User created: ${userId}`);
    }
    
    // Set password hash
    const hash = await bcrypt.hash(password, 10);
    
    const existingAccount = await client.query(
      `SELECT id FROM account WHERE "user_id" = $1 AND "provider_id" = 'credential'`,
      [userId]
    );
    
    if (existingAccount.rows.length > 0) {
      // Update existing account
      await client.query(
        `UPDATE account SET password = $1, "updated_at" = NOW()
         WHERE id = $2`,
        [hash, existingAccount.rows[0].id]
      );
      console.log('🔒 Password updated');
    } else {
      // Create new account
      const accountId = `account-${randomUUID()}`;
      await client.query(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [accountId, `email:${email}`, 'credential', userId, hash]
      );
      console.log('🔒 Account created with password');
    }
    
    // Get or create platinum package
    const platinumCheck = await client.query(
      `SELECT id FROM packages WHERE tier = 'platinum'`
    );
    
    let platformPackageId;
    if (platinumCheck.rows.length === 0) {
      platformPackageId = randomUUID();
      await client.query(
        `INSERT INTO packages (
          id, name, "display_name", description, tier, "base_price", 
          "is_visible", "sort_order", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          platformPackageId,
          'Platinum Package',
          'Platinum',
          'Full access to all AI Mentor features',
          'platinum',
          99900,
          true,
          3
        ]
      );
      console.log('📦 Platinum package created');
    } else {
      platformPackageId = platinumCheck.rows[0].id;
      console.log('📦 Platinum package found');
    }
    
    // Create subscription
    const subscriptionCheck = await client.query(
      `SELECT id FROM subscriptions 
       WHERE "user_id" = $1 AND "package_id" = $2 AND status = 'active'`,
      [userId, platformPackageId]
    );
    
    if (subscriptionCheck.rows.length === 0) {
      const subscriptionId = randomUUID();
      await client.query(
        `INSERT INTO subscriptions (
          id, "user_id", "package_id", status, "start_date", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, 'active', NOW(), NOW(), NOW())`,
        [subscriptionId, userId, platformPackageId]
      );
      console.log('✅ Platinum subscription activated');
    } else {
      console.log('✅ Active subscription already exists');
    }
    
    console.log('\n✨ OXFORD USER CREATED AND CONFIG COMPLETED SUCCESSFULLY\n');
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createOxfordUser().catch(console.error);
