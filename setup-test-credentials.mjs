#!/usr/bin/env node
/**
 * Create test user with platinum package
 * Supports both backend (students) DB and separate auth DB
 */
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

async function runQuery(client, sql, params = []) {
  try {
    const result = await client.query(sql, params);
    return result;
  } catch (error) {
    if (error.message.includes('does not exist')) {
      console.log(`  → Table doesn't exist yet, will create`);
      return null;
    }
    throw error;
  }
}

async function createAuthSchema(client) {
  console.log('\n📋 Creating authentication tables...');
  
  const tables = [
    // User table
    `CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      "email_verified" BOOLEAN DEFAULT false NOT NULL,
      image TEXT,
      role TEXT DEFAULT 'guest',
      banned BOOLEAN DEFAULT false,
      "ban_reason" TEXT,
      "ban_expires" TIMESTAMP,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )`,
    
    // Account table (for password)
    `CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      "account_id" TEXT NOT NULL,
      "provider_id" TEXT NOT NULL,
      "user_id" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "access_token" TEXT,
      "refresh_token" TEXT,
      "id_token" TEXT,
      "access_token_expires_at" TIMESTAMP,
      "refresh_token_expires_at" TIMESTAMP,
      scope TEXT,
      password TEXT,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE("user_id", "provider_id")
    )`,
    
    // Packages table
    `CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "display_name" TEXT NOT NULL,
      description TEXT,
      modules JSONB DEFAULT '[]'::jsonb,
      features JSONB DEFAULT '[]'::jsonb,
      tier TEXT DEFAULT 'custom',
      "base_price" INTEGER DEFAULT 0,
      currency TEXT DEFAULT 'BDT',
      "loyalty_points" INTEGER DEFAULT 0,
      "usage_limit" TEXT,
      "is_visible" BOOLEAN DEFAULT false,
      "is_popular" BOOLEAN DEFAULT false,
      badge TEXT,
      "sort_order" INTEGER DEFAULT 0,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )`,
    
    // Subscriptions table
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      "user_id" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      "package_id" TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'active',
      "promotion_id" TEXT,
      "loyalty_points_earned" INTEGER DEFAULT 0,
      "start_date" TIMESTAMP DEFAULT NOW() NOT NULL,
      "expires_at" TIMESTAMP,
      "suspended_at" TIMESTAMP,
      "auto_renew" BOOLEAN DEFAULT false,
      "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
    )`,
  ];
  
  for (const sql of tables) {
    try {
      await client.query(sql);
      console.log('  ✓ Table created/verified');
    } catch (error) {
      console.log(`  ⚠ ${error.message.split('\n')[0]}`);
    }
  }
}

async function createTestUser() {
  const password = 'TestPassword123!';
  const email = 'test@aimentor.local';
  
  console.log('\n🔐 Creating Test User Credentials\n');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Package:  Platinum\n`);
  
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✓ Connected to PostgreSQL');
    
    // Create schema if needed
    await createAuthSchema(client);
    
    // Check if user already exists
    const existingUser = await client.query(
      `SELECT id FROM "user" WHERE email = $1`,
      [email]
    );
    
    let userId;
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`\n📝 User already exists: ${userId}`);
    } else {
      userId = `test-user-${randomUUID()}`;
      await client.query(
        `INSERT INTO "user" (id, name, email, "email_verified", role, "created_at", "updated_at")
         VALUES ($1, $2, $3, true, 'guest', NOW(), NOW())`,
        [userId, 'Test User', email]
      );
      console.log(`\n📝 User created: ${userId}`);
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
          99900, // BDT
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
    
    // Display summary
    console.log('\n' + '='.repeat(50));
    console.log('✨ TEST CREDENTIALS READY\n');
    console.log(`📧 Email:    ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`💎 Package:  Platinum`);
    console.log('\n📍 Login at: http://203.190.9.168:3000');
    console.log('='.repeat(50));
    
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
createTestUser().catch(console.error);
