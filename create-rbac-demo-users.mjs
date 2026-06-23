// Seed one demo user per RBAC role for the "Role Based Login" page, and promote
// the primary `oxford@gmail.com` account to super_admin so it can impersonate.
//
// Idempotent: safe to run repeatedly. Mirrors frontend/lib/role-catalog.ts
// (email convention `rbac-<key>@demo.local`, password Demo@12345#) and the
// oxford org created by create-oxford-user.mjs.
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

const ORG_SLUG = 'oxford';
const PASSWORD = 'Demo@12345#';

// key, platformRole (user.role), orgRole (member.role). Keep in sync with role-catalog.ts.
const ROLES = [
  { key: 'super_admin', platformRole: 'super_admin', orgRole: 'owner',   label: 'Super Admin' },
  { key: 'support',     platformRole: 'support',     orgRole: 'mentor',  label: 'Support' },
  { key: 'user',        platformRole: 'user',        orgRole: 'member',  label: 'User' },
  { key: 'guest',       platformRole: 'guest',       orgRole: 'guest',   label: 'Guest' },
  { key: 'owner',       platformRole: 'user',        orgRole: 'owner',   label: 'Org Owner' },
  { key: 'admin',       platformRole: 'user',        orgRole: 'admin',   label: 'Org Admin' },
  { key: 'analyst',     platformRole: 'user',        orgRole: 'analyst', label: 'Analyst' },
  { key: 'mentor',      platformRole: 'user',        orgRole: 'mentor',  label: 'Mentor' },
  { key: 'viewer',      platformRole: 'user',        orgRole: 'viewer',  label: 'Viewer' },
];

async function upsertDemoUser(client, orgId, role, hash) {
  const email = `rbac-${role.key}@demo.local`;
  const name = `${role.label} (demo)`;

  // 1) user row (set platform role)
  let userId;
  const existing = await client.query(`SELECT id FROM "user" WHERE email = $1`, [email]);
  if (existing.rows.length) {
    userId = existing.rows[0].id;
    await client.query(`UPDATE "user" SET role = $1, name = $2, "updated_at" = NOW() WHERE id = $3`,
      [role.platformRole, name, userId]);
  } else {
    userId = `rbac-${role.key}-${randomUUID()}`;
    await client.query(
      `INSERT INTO "user" (id, name, email, "email_verified", role, "created_at", "updated_at")
       VALUES ($1, $2, $3, true, $4, NOW(), NOW())`,
      [userId, name, email, role.platformRole]);
  }

  // 2) credential account (password)
  const acct = await client.query(
    `SELECT id FROM account WHERE "user_id" = $1 AND "provider_id" = 'credential'`, [userId]);
  if (acct.rows.length) {
    await client.query(`UPDATE account SET password = $1, "updated_at" = NOW() WHERE id = $2`,
      [hash, acct.rows[0].id]);
  } else {
    await client.query(
      `INSERT INTO account (id, account_id, provider_id, user_id, password, "created_at", "updated_at")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [`account-${randomUUID()}`, `email:${email}`, userId, hash]);
  }

  // 3) membership in the oxford org with the demo's org role
  const mem = await client.query(
    `SELECT id FROM member WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
  if (mem.rows.length) {
    await client.query(`UPDATE member SET role = $1 WHERE id = $2`, [role.orgRole, mem.rows[0].id]);
  } else {
    await client.query(
      `INSERT INTO member (id, organization_id, user_id, role, "created_at")
       VALUES ($1, $2, $3, $4, NOW())`,
      [`member-${randomUUID()}`, orgId, userId, role.orgRole]);
  }

  return { email, userId, ...role };
}

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('✓ Connected to PostgreSQL');

  // Find the oxford org (created by create-oxford-user.mjs).
  const orgRes = await client.query(`SELECT id FROM organization WHERE slug = $1`, [ORG_SLUG]);
  if (orgRes.rows.length === 0) {
    console.error(`❌ Organization '${ORG_SLUG}' not found. Run create-oxford-user.mjs first.`);
    process.exit(1);
  }
  const orgId = orgRes.rows[0].id;

  // Promote the primary account to super_admin so it can impersonate.
  const promoted = await client.query(
    `UPDATE "user" SET role = 'super_admin', "updated_at" = NOW() WHERE email = 'oxford@gmail.com' RETURNING id`);
  if (promoted.rows.length) console.log('👑 oxford@gmail.com promoted to super_admin');
  else console.log('⚠️  oxford@gmail.com not found (skipped promotion)');

  const hash = await hashPassword(PASSWORD);
  console.log(`\n🌱 Seeding ${ROLES.length} demo role users (password: ${PASSWORD})`);
  for (const role of ROLES) {
    const r = await upsertDemoUser(client, orgId, role, hash);
    console.log(`   ✓ ${r.email}  →  platform=${r.platformRole}, org=${r.orgRole}`);
  }

  await client.end();
  console.log('\n✨ RBAC demo users ready.\n');
}

main().catch((e) => { console.error('❌ Error:', e); process.exit(1); });
