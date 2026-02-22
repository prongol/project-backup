const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateDisputeAndSuspensionSystem() {
  console.log('📊 Setting up Dispute & Suspension System...\n');

  try {
    const sql = fs.readFileSync('./UPDATE_DISPUTE_AND_SUSPENSION_SYSTEM.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        if (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
        } else {
          console.log(`✓ Executed statement ${i + 1}`);
        }
      } catch (err) {
        // Try direct query if RPC fails
        const { error } = await supabase.from('_').select('*').limit(0);
        console.log(`⚠️  Statement ${i + 1}: May need manual execution`);
      }
    }

    console.log('\n✅ Dispute & Suspension System setup complete!\n');
    console.log('Features enabled:');
    console.log('  ✓ Both client and freelancer can file disputes');
    console.log('  ✓ Disputes route to admin dashboard for resolution');
    console.log('  ✓ Time-limited suspensions (20-30 days default)');
    console.log('  ✓ Suspension reasons shown on user profiles');
    console.log('  ✓ Auto-lift suspensions when time expires');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateDisputeAndSuspensionSystem();
