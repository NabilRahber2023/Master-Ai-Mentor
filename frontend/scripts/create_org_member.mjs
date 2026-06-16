import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  const obj = {};
  for (const line of lines) {
    const m = line.match(/^\s*([^=]+)=\s*(.*)\s*$/);
    if (!m) continue;
    obj[m[1]] = m[2];
  }
  return obj;
}

(async function main(){
  try {
    const env = loadEnv();
    const connectionString = process.env.DATABASE_URL || env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL not found in environment or .env.local');
      process.exit(1);
    }

    const client = new Client({ connectionString });
    await client.connect();

    const email = 'oxford@gmail.com';
    const userRes = await client.query('SELECT id FROM "user" WHERE email = $1 LIMIT 1', [email]);
    if (userRes.rowCount === 0) {
      console.error('User not found:', email);
      await client.end();
      process.exit(1);
    }
    const userId = userRes.rows[0].id;

    // create organization
    const orgId = uuidv4();
    const slug = 'oxford';
    const name = 'Oxford Test Org';
    const metadata = JSON.stringify({ packageId: 'gold', enabledModules: ['grade-prediction','career-guidance'] });

    // check if org exists
    const check = await client.query('SELECT id FROM organization WHERE slug = $1 LIMIT 1', [slug]);
    if (check.rowCount > 0) {
      console.log('Organization already exists with slug', slug);
    } else {
      await client.query(
        'INSERT INTO organization (id,name,slug,metadata) VALUES ($1,$2,$3,$4)',
        [orgId, name, slug, metadata]
      );
      console.log('Inserted organization', slug);
    }

    // create member linking user to org
    // see if member exists
    const orgRow = (await client.query('SELECT id FROM organization WHERE slug = $1 LIMIT 1', [slug])).rows[0];
    const orgIdExisting = orgRow.id;
    const memberCheck = await client.query('SELECT id FROM member WHERE organization_id = $1 AND user_id = $2 LIMIT 1', [orgIdExisting, userId]);
    if (memberCheck.rowCount > 0) {
      console.log('Member already exists for user in org');
    } else {
      const memberId = uuidv4();
      await client.query('INSERT INTO member (id,organization_id,user_id,role) VALUES ($1,$2,$3,$4)', [memberId, orgIdExisting, userId, 'owner']);
      console.log('Inserted member linking user to organization');
    }

    await client.end();
    console.log('Done');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
