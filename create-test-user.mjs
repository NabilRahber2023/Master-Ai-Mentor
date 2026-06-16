#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import pg from 'pg';
import { randomUUID } from 'crypto';

#!/usr/bin/env node
/**
 * Direct SQL approach to create test user
 * This bypasses API and goes straight to database with proper Better Auth structure
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
  const password = 'TestPassword123!';
  const email = 'test@aimentor.local';
  
async function createTestUserDirect() {
  const email = 'test@aimentor.local';
  const password = 'TestPassword123!';
  const name = 'Test User';

    
      user: 'postgres',
      password: 'postgres',
    });
    
    await client.connect();
    console.log('✓ Connected to PostgreSQL');
    

    const userId = `test-user-${randomUUID()}`;
    console.log('✓ Connected to database\n');

    // Generate hash
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('✓ Password hashed\n');

    // Start transaction
    await client.query('BEGIN');

    // Check if user exists
    let userId;
    const existingUser = await client.query(
      'SELECT id FROM "user" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
      console.log(`✓ User already exists: ${userId}`);
      
      // Delete existing account to recreate it
      await client.query(
        'DELETE FROM account WHERE user_id = $1 AND provider_id = $2',
        [userId, 'credential']
      );
      console.log('  Removed old account credential\n');
    } else {
      // Create new user
      userId = `user-${randomUUID()}`;
    }

    // Ensure user row exists
      [userId, 'Test User', email]
      `INSERT INTO "user" (id, name, email, "email_verified", role, "created_at", "updated_at")
       VALUES ($1, $2, $3, true, 'guest', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [userId, name, email]
    const accountId = `account-${randomUUID()}`;
    console.log(`✓ User created: ${userId}\n`);

    // Create/update account with email+password provider
    // Better Auth uses specific structure for email+password
    const accountId = `account-${randomUUID()}`;
      [accountId, 'email:' + email, 'credential', userId, hash]
      `INSERT INTO account (
        id, 
        "account_id", 
        "provider_id", 
        "user_id",
        password,
        "created_at",
        "updated_at"
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [
        accountId,
        email, // Better Auth uses email as account_id for email provider
        'credential',
        userId,
        passwordHash,
      ]
    let platinumPackageId;
    const platinumResult = await client.query(

    // Create/verify subscription
    const platinumPkg = await client.query(
      'SELECT id FROM packages WHERE tier = $1',
      ['platinum']
      const pkgId = randomUUID();

    if (platinumPkg.rows.length > 0) {
      // Check if subscription exists
      const existingSub = await client.query(
        `SELECT id FROM subscriptions 
         WHERE user_id = $1 AND status = $2`,
        [userId, 'active']
      );

      if (existingSub.rows.length === 0) {
        const subscriptionId = randomUUID();
        await client.query(
          `INSERT INTO subscriptions (
            id, user_id, package_id, status, "start_date", "created_at", "updated_at"
          ) VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
          [subscriptionId, userId, platinumPkg.rows[0].id, 'active']
        );
        console.log('✓ Platinum subscription created\n');
      } else {
        console.log('✓ Active subscription already exists\n');
      }
    
      console.log('⚠ Platinum package not found\n');
    await client.query(

    // Commit transaction
    await client.query('COMMIT');

    // Verify everything
    const verify = await client.query(
      `SELECT 
        u.id, u.email, u.role,
        COUNT(a.id) as account_count,
        COUNT(s.id) as subscription_count
      FROM "user" u
      LEFT JOIN account a ON u.id = a.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.email = $1
      GROUP BY u.id, u.email, u.role`,
      [email]
    );

    const record = verify.rows[0];

    console.log('='.repeat(50));
    console.log('✨ TEST USER CREATED SUCCESSFULLY\n');
    console.log(`📧 Email:       ${email}`);
    console.log(`🔐 Password:    ${password}`);
    console.log(`💎 Package:     Platinum`);
    console.log(`👤 User ID:     ${record.id}`);
    console.log(`📋 Accounts:    ${record.account_count}`);
    console.log(`🎁 Subscriptions: ${record.subscription_count}\n`);
    console.log('='.repeat(50));
    console.log('\nNow you can login at:');
    console.log('http://localhost:3000/login  (dev)');
    console.log('http://localhost:3001/login  (production)');
    console.log('http://203.190.9.168:3001    (remote)\n');

    );
      'ROLLBACK'
    ).catch(() => {});
    await client.end();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createTestUserDirect().catch(console.error);
    console.log('\n=== TEST CREDENTIALS ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Package: Platinum`);
    console.log(`User ID: ${userId}`);
    console.log('\nYou can now login with these credentials at the application login page.');
    
    await client.end();
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
