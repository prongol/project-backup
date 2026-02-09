import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('\n🔍 Fetching all tables from database...\n');
  
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    // Try alternative method using RPC
    const { data: tables, error: rpcError } = await supabase
      .rpc('get_all_tables');
    
    if (rpcError) {
      console.log('Tables we know exist:');
      const knownTables = [
        'profiles', 'clients', 'freelancers', 'jobs', 'proposals', 
        'contracts', 'notifications', 'messages', 'escrow_accounts',
        'transactions', 'contract_disputes', 'activities'
      ];
      
      for (const table of knownTables) {
        const { error: checkError } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!checkError) {
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table} - ${checkError.message}`);
        }
      }
      
      // Check for work_reviews specifically
      console.log('\nChecking specific tables:');
      const criticalTables = [
        'work_reviews', 'contract_submissions', 'requirement_verifications',
        'dispute_evidence', 'payment_setup_progress', 'platform_fees'
      ];
      
      for (const table of criticalTables) {
        const { error: checkError } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!checkError) {
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table} - MISSING`);
        }
      }
    }
  } else {
    console.log('All tables in public schema:');
    data.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
  }
}

checkAllTables();
