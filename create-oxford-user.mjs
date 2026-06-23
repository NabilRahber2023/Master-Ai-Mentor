// NOTE: better-auth (the frontend auth library) verifies passwords with its own
// scrypt-based hasher, NOT bcrypt. Seeding a bcrypt hash causes a 500
// "Invalid password hash" on sign-in. We hash with better-auth's own helper so
// the documented credentials actually work.
import { hashPassword } from './frontend/node_modules/better-auth/dist/crypto/index.mjs';
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
    
    // Set password hash using better-auth's own scrypt hasher (verifiable at sign-in)
    const hash = await hashPassword(password);
    
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
    
    // ---------------------------------------------------------------
    // Organization + membership + module entitlements.
    // The tenant layout (/:slug/*) looks up the org by slug and checks
    // membership; without these rows the app redirects /oxford/home → "/"
    // and the proxy bounces it back, causing ERR_TOO_MANY_REDIRECTS.
    // The login flow sets active-org-slug=<org.slug>, so the slug must be 'oxford'.
    // ---------------------------------------------------------------
    const MODULES = [
      { id: 'grade-prediction',   name: 'Grade Prediction',   description: 'Predict student SGPA/grades',         sort: '1' },
      { id: 'batch-prediction',   name: 'Batch Prediction',   description: 'Run predictions across all students', sort: '2' },
      { id: 'career-guidance',    name: 'Career Guidance',    description: 'Career path recommendations',         sort: '3' },
      { id: 'subject-prediction', name: 'Subject Prediction', description: 'Per-subject performance prediction',  sort: '4' },
      { id: 'growth-potential',   name: 'Growth Potential',   description: '9-Box growth/potential analysis',     sort: '5' },
      { id: 'ai-chatbot',         name: 'AI Chatbot',         description: 'Conversational student assistant',    sort: '6' },
    ];

    // Seed the module catalog (idempotent).
    for (const m of MODULES) {
      await client.query(
        `INSERT INTO module_registry (id, name, description, global_enabled, sort_order)
         VALUES ($1, $2, $3, true, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, global_enabled = true`,
        [m.id, m.name, m.description, m.sort]
      );
    }
    console.log('🧩 Module catalog seeded (6 modules)');

    // Create the Oxford organization (slug must match the login cookie).
    const orgSlug = 'oxford';
    const orgCheck = await client.query(`SELECT id FROM organization WHERE slug = $1`, [orgSlug]);
    let orgId;
    if (orgCheck.rows.length > 0) {
      orgId = orgCheck.rows[0].id;
      console.log('🏢 Organization already exists:', orgSlug);
    } else {
      orgId = `org-${randomUUID()}`;
      await client.query(
        `INSERT INTO organization (id, name, slug, metadata, "created_at")
         VALUES ($1, $2, $3, $4, NOW())`,
        [orgId, 'Oxford Test Org', orgSlug, JSON.stringify({ packageId: 'platinum' })]
      );
      console.log('🏢 Organization created:', orgSlug);
    }

    // Link the user as owner of the org.
    const memberCheck = await client.query(
      `SELECT id FROM member WHERE organization_id = $1 AND user_id = $2`,
      [orgId, userId]
    );
    if (memberCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO member (id, organization_id, user_id, role, "created_at")
         VALUES ($1, $2, $3, 'owner', NOW())`,
        [`member-${randomUUID()}`, orgId, userId]
      );
      console.log('👤 Membership created (owner)');
    } else {
      console.log('👤 Membership already exists');
    }

    // Entitle the org to every module.
    for (const m of MODULES) {
      await client.query(
        `INSERT INTO org_module (id, organization_id, module_id, enabled)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (organization_id, module_id) DO UPDATE SET enabled = true`,
        [`om-${randomUUID()}`, orgId, m.id]
      );
    }
    console.log('🔓 All modules enabled for organization');

    console.log('\n✨ OXFORD USER CREATED AND CONFIG COMPLETED SUCCESSFULLY\n');
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createOxfordUser().catch(console.error);
