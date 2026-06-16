import pkg from 'pg';
const { Pool } = pkg;

const dbUrl = 'postgresql://postgres:postgres@localhost:5433/ai_mentor';
const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM packages');
    console.log('Current packages in DB:', res.rows);
    
    // Check if we need to update visibility or insert missing packages
    // The user wants Silver, Gold, and Platinum to be visible and working.
    // Let's check which tiers exist.
    const tiers = res.rows.map(r => r.tier);
    console.log('Existing tiers:', tiers);

    if (!tiers.includes('silver')) {
      console.log('Inserting Silver package...');
      await client.query(`
        INSERT INTO packages (id, name, display_name, description, modules, features, tier, base_price, currency, loyalty_points, usage_limit, is_visible, is_popular, badge, sort_order)
        VALUES (
          'silver-pkg',
          'Silver',
          'Silver Plan',
          'Perfect for small institutions getting started with AI grade prediction.',
          '["grade-prediction"]'::json,
          '["Grade Prediction & Analytics", "Historical data analysis", "Performance forecasting", "Study pattern recognition", "Email support", "Monthly performance reports"]'::json,
          'silver',
          29900,
          'BDT',
          100,
          'Up to 100 users per month',
          true,
          false,
          'Starter',
          1
        )
      `);
    } else {
      console.log('Silver package exists. Ensuring it is visible...');
      await client.query("UPDATE packages SET is_visible = true WHERE tier = 'silver'");
    }

    if (!tiers.includes('gold')) {
      console.log('Inserting Gold package...');
      await client.query(`
        INSERT INTO packages (id, name, display_name, description, modules, features, tier, base_price, currency, loyalty_points, usage_limit, is_visible, is_popular, badge, sort_order)
        VALUES (
          'gold-pkg',
          'Gold',
          'Gold Plan',
          'Comprehensive package with advanced career guidance tools.',
          '["grade-prediction", "career-guidance"]'::json,
          '["All Silver features", "Career Guidance & Roadmap", "Strength & interest analysis", "Subject recommendations", "Career path planning", "Priority email support", "Weekly analytics reports"]'::json,
          'gold',
          59900,
          'BDT',
          250,
          'Up to 250 users per month',
          true,
          true,
          'Most Popular',
          2
        )
      `);
    } else {
      console.log('Gold package exists. Ensuring it is visible...');
      await client.query("UPDATE packages SET is_visible = true WHERE tier = 'gold'");
    }

    // Ensure Platinum is visible too
    await client.query("UPDATE packages SET is_visible = true WHERE tier = 'platinum'");

    const finalRes = await client.query('SELECT id, name, tier, is_visible, base_price FROM packages');
    console.log('Final packages status:', finalRes.rows);

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
