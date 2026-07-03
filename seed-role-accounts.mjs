// Seeds the 9 demo role accounts used by the Role Access Portal (/login).
//
// These are REAL system accounts: a `user` row (with the correct platform role),
// a `credential` account row (password hashed with Better Auth's own scrypt hasher
// so the normal sign-in flow verifies it), and a `member` row in the existing
// "oxford" organization (with the correct org role). No bypass, no fake auth —
// they log in through the exact same production pipeline as every other user.
//
// The Owner account (oxford@gmail.com) is intentionally NOT touched here.
// Idempotent: safe to re-run.
import { hashPassword } from "./frontend/node_modules/better-auth/dist/crypto/index.mjs";
import pg from "pg";
import { randomUUID } from "crypto";

const { Client } = pg;

const DB_CONFIG = {
  host: "localhost",
  port: 5433,
  database: "ai_mentor",
  user: "postgres",
  password: "postgres",
};

const ORG_SLUG = "daffodil";
const PASSWORD = "Demo@123";

// role → (platform role on user.role, org role on member.role)
const ACCOUNTS = [
  { email: "superadmin@system.com", name: "Super Admin", platformRole: "super_admin", orgRole: "owner" },
  { email: "support@system.com",    name: "Support",     platformRole: "support",     orgRole: "mentor" },
  { email: "user@system.com",       name: "User",        platformRole: "user",        orgRole: "mentor" },
  { email: "guest@system.com",      name: "Guest",       platformRole: "guest",       orgRole: "guest" },
  { email: "orgowner@system.com",   name: "Org Owner",   platformRole: "user",        orgRole: "owner" },
  { email: "orgadmin@system.com",   name: "Org Admin",   platformRole: "user",        orgRole: "admin" },
  { email: "analyst@system.com",    name: "Analyst",     platformRole: "user",        orgRole: "analyst" },
  { email: "mentor@system.com",     name: "Mentor",      platformRole: "user",        orgRole: "mentor" },
  { email: "viewer@system.com",     name: "Viewer",      platformRole: "user",        orgRole: "viewer" },
];

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log("✓ Connected to PostgreSQL");

  // The org the demo accounts belong to (created by create-oxford-user.mjs).
  const orgRes = await client.query(`SELECT id FROM organization WHERE slug = $1 LIMIT 1`, [ORG_SLUG]);
  if (orgRes.rows.length === 0) {
    console.error(`❌ Organization "${ORG_SLUG}" not found. Run create-oxford-user.mjs first.`);
    process.exit(1);
  }
  const orgId = orgRes.rows[0].id;
  const hash = await hashPassword(PASSWORD);

  for (const acc of ACCOUNTS) {
    // 1) user (with platform role)
    const existing = await client.query(`SELECT id FROM "user" WHERE email = $1`, [acc.email]);
    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await client.query(`UPDATE "user" SET role = $1, name = $2, "updated_at" = NOW() WHERE id = $3`,
        [acc.platformRole, acc.name, userId]);
    } else {
      userId = `role-${acc.platformRole}-${randomUUID()}`;
      await client.query(
        `INSERT INTO "user" (id, name, email, "email_verified", role, "created_at", "updated_at")
         VALUES ($1, $2, $3, true, $4, NOW(), NOW())`,
        [userId, acc.name, acc.email, acc.platformRole]
      );
    }

    // 2) credential account (scrypt password) — upsert
    const acct = await client.query(
      `SELECT id FROM account WHERE "user_id" = $1 AND "provider_id" = 'credential'`, [userId]);
    if (acct.rows.length > 0) {
      await client.query(`UPDATE account SET password = $1, "updated_at" = NOW() WHERE id = $2`,
        [hash, acct.rows[0].id]);
    } else {
      await client.query(
        `INSERT INTO account (id, account_id, provider_id, user_id, password, "created_at", "updated_at")
         VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
        [`account-${randomUUID()}`, `email:${acc.email}`, userId, hash]
      );
    }

    // 3) membership in the oxford org (with org role) — upsert
    const mem = await client.query(
      `SELECT id FROM member WHERE organization_id = $1 AND user_id = $2`, [orgId, userId]);
    if (mem.rows.length > 0) {
      await client.query(`UPDATE member SET role = $1 WHERE id = $2`, [acc.orgRole, mem.rows[0].id]);
    } else {
      await client.query(
        `INSERT INTO member (id, organization_id, user_id, role, "created_at")
         VALUES ($1, $2, $3, $4, NOW())`,
        [`member-${randomUUID()}`, orgId, userId, acc.orgRole]
      );
    }

    console.log(`  ✓ ${acc.email.padEnd(24)} platform=${acc.platformRole.padEnd(12)} org=${acc.orgRole}`);
  }

  await client.end();
  console.log(`\n✨ Seeded ${ACCOUNTS.length} role accounts (password: ${PASSWORD}). Owner left untouched.\n`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
