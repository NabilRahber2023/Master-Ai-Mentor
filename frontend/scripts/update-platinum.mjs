import pkg from 'pg';
const { Pool } = pkg;

const dbUrl = 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const client = await pool.connect();
  try {
    const modules = JSON.stringify([
      "grade-prediction",
      "career-guidance",
      "ai-chatbot",
      "growth-potential"
    ]);

    const features = JSON.stringify([
      "All Gold features",
      "AI Chatbot Mentor (24/7)",
      "Instant question answering",
      "Complex concept explanations",
      "Growth Potential Analysis (9-Box)",
      "Performance matrix insights",
      "24/7 Priority support",
      "Dedicated account manager",
      "Custom integrations"
    ]);

    console.log('Updating Platinum package in DB...');
    await client.query(`
      UPDATE packages 
      SET 
        name = 'Platinum',
        display_name = 'Platinum Plan',
        description = 'Enterprise-grade package with all AI features and dedicated support.',
        modules = $1::json,
        features = $2::json,
        usage_limit = 'Unlimited users',
        badge = 'Enterprise',
        sort_order = 3
      WHERE tier = 'platinum'
    `, [modules, features]);

    console.log('✅ Platinum package updated successfully!');

    const finalRes = await client.query("SELECT id, name, tier, modules, features, usage_limit FROM packages WHERE tier = 'platinum'");
    console.log('Final Platinum status:', finalRes.rows[0]);

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
