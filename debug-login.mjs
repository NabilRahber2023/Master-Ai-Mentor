#!/usr/bin/env node
/**
 * Debug test user login issue
 * Checks if user exists, password is set, and auth is working
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

async function debugLogin() {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'ai_mentor',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Check user exists
    const userResult = await client.query(
      `SELECT id, name, email, role FROM "user" WHERE email = 'test@aimentor.local'`
    );

    if (userResult.rows.length === 0) {
      console.log('❌ ERROR: User does not exist!');
      console.log('   Run: node setup-test-credentials.mjs');
      await client.end();
      process.exit(1);
    }

    const user = userResult.rows[0];
    console.log('✓ User found:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}\n`);

    // Check account with password
    const accountResult = await client.query(
      `SELECT id, provider_id, password, account_id FROM account 
       WHERE user_id = $1`,
      [user.id]
    );

    if (accountResult.rows.length === 0) {
      console.log('❌ ERROR: No account found for user!');
      console.log('   Password not set properly.\n');
      
      // Fix: Insert account
      const password = 'TestPassword123!';
      const hash = await bcrypt.hash(password, 10);
      
      await client.query(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())`,
        [`email:${user.email}`, 'credential', user.id, hash]
      );
      
      console.log('✓ Account created with password hash');
    } else {
      const account = accountResult.rows[0];
      console.log('✓ Account found:');
      console.log(`  ID: ${account.id}`);
      console.log(`  Provider: ${account.provider_id}`);
      console.log(`  Password Hash: ${account.password ? 'SET ✓' : 'NOT SET ❌'}\n`);
      
      // Test password verification
      if (account.password) {
        const testPassword = 'TestPassword123!';
        const matches = await bcrypt.compare(testPassword, account.password);
        
        if (matches) {
          console.log('✓ Password verification: WORKS');
        } else {
          console.log('❌ Password hash does not match TestPassword123!');
          console.log('   Updating password...');
          
          const newHash = await bcrypt.hash(testPassword, 10);
          await client.query(
            `UPDATE account SET password = $1, updated_at = NOW() WHERE id = $2`,
            [newHash, account.id]
          );
          
          console.log('✓ Password updated');
        }
      }
    }

    // Check subscription
    const subResult = await client.query(
      `SELECT s.id, s.status, p.name, p.tier 
       FROM subscriptions s
       LEFT JOIN packages p ON s.package_id = p.id
       WHERE s.user_id = $1`,
      [user.id]
    );

    console.log('\n✓ Subscription:');
    if (subResult.rows.length === 0) {
      console.log('  ❌ No subscription found');
    } else {
      const sub = subResult.rows[0];
      console.log(`  Package: ${sub.name} (${sub.tier})`);
      console.log(`  Status: ${sub.status}`);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🔐 LOGIN CREDENTIALS');
    console.log('Email:    test@aimentor.local');
    console.log('Password: TestPassword123!');
    console.log('='.repeat(50));

    await client.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

debugLogin();
