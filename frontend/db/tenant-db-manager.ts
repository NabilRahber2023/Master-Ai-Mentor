import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, Client } from "pg";
import * as tenantSchema from "./tenant-schema";

// Connection pool cache for tenant databases
const tenantPools: Map<string, Pool> = new Map();

/**
 * Get or create a connection pool for a tenant database
 */
export function getTenantDb(tenantDbName: string) {
    // Check if pool already exists
    if (tenantPools.has(tenantDbName)) {
        const pool = tenantPools.get(tenantDbName)!;
        return drizzle({ client: pool, schema: tenantSchema });
    }

    // Create new pool for this tenant
    const connectionString = buildTenantConnectionString(tenantDbName);
    const pool = new Pool({
        connectionString,
        max: 10, // Max connections per tenant
        idleTimeoutMillis: 30000,
    });

    tenantPools.set(tenantDbName, pool);
    return drizzle({ client: pool, schema: tenantSchema });
}

/**
 * Build connection string for tenant database
 * Uses the same host/port/user as master DB but different database name
 */
function buildTenantConnectionString(tenantDbName: string): string {
    const masterUrl = process.env.DATABASE_URL!;
    const url = new URL(masterUrl);
    url.pathname = `/${tenantDbName}`;
    return url.toString();
}

/**
 * Create a new tenant database
 * This should be called when a new organization registers
 */
export async function createTenantDatabase(slug: string): Promise<string> {
    const tenantDbName = `tenant_${slug.replace(/-/g, "_")}`;

    // Connect to master database to create new database
    const masterClient = new Client({
        connectionString: process.env.DATABASE_URL!,
    });

    try {
        await masterClient.connect();

        // Check if database already exists
        const checkResult = await masterClient.query(
            `SELECT 1 FROM pg_database WHERE datname = $1`,
            [tenantDbName]
        );

        if (checkResult.rows.length === 0) {
            // Create the database (must use template0 for clean slate)
            await masterClient.query(`CREATE DATABASE "${tenantDbName}"`);
            console.log(`Created tenant database: ${tenantDbName}`);

            // Run migrations on the new tenant database
            await runTenantMigrations(tenantDbName);
        } else {
            console.log(`Tenant database already exists: ${tenantDbName}`);
        }

        return tenantDbName;
    } catch (error) {
        console.error(`Failed to create tenant database: ${tenantDbName}`, error);
        throw error;
    } finally {
        await masterClient.end();
    }
}

/**
 * Run migrations to create tenant schema tables
 */
async function runTenantMigrations(tenantDbName: string): Promise<void> {
    const connectionString = buildTenantConnectionString(tenantDbName);
    const client = new Client({ connectionString });

    try {
        await client.connect();

        // Create tenant-specific tables
        await client.query(`
            -- Students table
            CREATE TABLE IF NOT EXISTS student (
                id TEXT PRIMARY KEY,
                student_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                email TEXT,
                department TEXT,
                semester INTEGER,
                cgpa DECIMAL(3,2),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Grade predictions table
            CREATE TABLE IF NOT EXISTS grade_prediction (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
                course_code TEXT NOT NULL,
                predicted_grade TEXT,
                confidence DECIMAL(5,2),
                factors JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Career recommendations table
            CREATE TABLE IF NOT EXISTS career_recommendation (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL REFERENCES student(id) ON DELETE CASCADE,
                career_path TEXT NOT NULL,
                match_score DECIMAL(5,2),
                skills_gap JSONB,
                recommendations JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );

            -- Chat history table
            CREATE TABLE IF NOT EXISTS chat_history (
                id TEXT PRIMARY KEY,
                student_id TEXT REFERENCES student(id) ON DELETE SET NULL,
                user_id TEXT,
                messages JSONB NOT NULL DEFAULT '[]',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_student_student_id ON student(student_id);
            CREATE INDEX IF NOT EXISTS idx_student_department ON student(department);
            CREATE INDEX IF NOT EXISTS idx_grade_prediction_student ON grade_prediction(student_id);
            CREATE INDEX IF NOT EXISTS idx_career_recommendation_student ON career_recommendation(student_id);
            CREATE INDEX IF NOT EXISTS idx_chat_history_student ON chat_history(student_id);
        `);

        console.log(`Tenant migrations completed for: ${tenantDbName}`);
    } catch (error) {
        console.error(`Failed to run migrations for: ${tenantDbName}`, error);
        throw error;
    } finally {
        await client.end();
    }
}

/**
 * Delete a tenant database (use with caution!)
 */
export async function deleteTenantDatabase(slug: string): Promise<void> {
    const tenantDbName = `tenant_${slug.replace(/-/g, "_")}`;

    // Close any existing pool
    const pool = tenantPools.get(tenantDbName);
    if (pool) {
        await pool.end();
        tenantPools.delete(tenantDbName);
    }

    const masterClient = new Client({
        connectionString: process.env.DATABASE_URL!,
    });

    try {
        await masterClient.connect();

        // Terminate connections to the database
        await masterClient.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [tenantDbName]);

        // Drop the database
        await masterClient.query(`DROP DATABASE IF EXISTS "${tenantDbName}"`);
        console.log(`Deleted tenant database: ${tenantDbName}`);
    } finally {
        await masterClient.end();
    }
}

/**
 * Close all tenant connection pools (for cleanup)
 */
export async function closeAllTenantPools(): Promise<void> {
    for (const [name, pool] of tenantPools) {
        await pool.end();
        console.log(`Closed pool for: ${name}`);
    }
    tenantPools.clear();
}
