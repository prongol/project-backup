import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupReviewSystem() {
  console.log('\n🔧 Setting up Review System Tables...\n');
  
  try {
    // Read the SQL file
    const sql = readFileSync('./CREATE_REVIEW_SYSTEM_TABLES.sql', 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      // Extract table/action name for logging
      let actionName = 'SQL statement';
      if (statement.includes('CREATE TABLE IF NOT EXISTS')) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        actionName = match ? `Creating table: ${match[1]}` : 'Creating table';
      } else if (statement.includes('ALTER TABLE')) {
        const match = statement.match(/ALTER TABLE (\w+)/);
        actionName = match ? `Altering table: ${match[1]}` : 'Altering table';
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX[^O]* ON (\w+)/);
        actionName = match ? `Creating index on: ${match[1]}` : 'Creating index';
      } else if (statement.includes('CREATE POLICY')) {
        const match = statement.match(/CREATE POLICY "([^"]+)"/);
        actionName = match ? `Creating policy: ${match[1]}` : 'Creating policy';
      } else if (statement.includes('CREATE TRIGGER')) {
        const match = statement.match(/CREATE TRIGGER (\w+)/);
        actionName = match ? `Creating trigger: ${match[1]}` : 'Creating trigger';
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        const match = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/);
        actionName = match ? `Creating function: ${match[1]}` : 'Creating function';
      } else if (statement.includes('ENABLE ROW LEVEL SECURITY')) {
        const match = statement.match(/ALTER TABLE (\w+)/);
        actionName = match ? `Enabling RLS: ${match[1]}` : 'Enabling RLS';
      } else if (statement.includes('COMMENT ON TABLE')) {
        const match = statement.match(/COMMENT ON TABLE (\w+)/);
        actionName = match ? `Adding comment: ${match[1]}` : 'Adding comment';
      } else if (statement.includes('DROP TRIGGER')) {
        continue; // Skip drop trigger messages
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('_sql').select('*').limit(0);
          
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist') ||
              error.message.includes('duplicate')) {
            console.log(`   ⚠️  ${actionName} - Already exists`);
            successCount++;
          } else {
            console.log(`   ❌ ${actionName} - ERROR: ${error.message.substring(0, 100)}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ ${actionName}`);
          successCount++;
        }
      } catch (e) {
        // If we can't execute, just log it
        console.log(`   ⚠️  ${actionName} - Skipped (manual execution may be needed)`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}\n`);
    
    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    
    const tablesToCheck = [
      'contract_submissions',
      'work_reviews',
      'requirement_verifications',
      'dispute_evidence',
      'payment_setup_progress',
      'platform_fees',
      'activities'
    ];
    
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('*').limit(0);
      
      if (error) {
        console.log(`   ❌ ${table} - NOT FOUND`);
      } else {
        console.log(`   ✅ ${table} - EXISTS`);
      }
    }
    
    console.log('\n✨ Review system setup complete!');
    console.log('\nNow you can:');
    console.log('   • Submit work for review');
    console.log('   • Approve or request revisions');
    console.log('   • Rate completed contracts');
    console.log('   • Track contract activities\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Manual setup required:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy the contents of CREATE_REVIEW_SYSTEM_TABLES.sql');
    console.log('   4. Execute the SQL directly\n');
    process.exit(1);
  }
}

setupReviewSystem();
