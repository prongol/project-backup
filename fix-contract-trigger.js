// Quick script to fix the contract trigger error
// Run with: node fix-contract-trigger.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n========================================');
console.log('🔧 FIXING CONTRACT TRIGGER');
console.log('========================================\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ ERROR: Environment variables not found!');
  console.log('\nMake sure .env.local exists with:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=your-url');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key\n');
  process.exit(1);
}

console.log('✅ Environment variables loaded\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFix() {
  try {
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, 'FIX_CONTRACT_TRIGGER.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Reading SQL fix file...');
    console.log('📤 Executing SQL to fix trigger...\n');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('❌ Error executing SQL:', error.message);
      console.log('\n⚠️  MANUAL FIX REQUIRED:');
      console.log('\n1. Go to: https://supabase.com');
      console.log('2. Click "SQL Editor" in the sidebar');
      console.log('3. Open the file: FIX_CONTRACT_TRIGGER.sql');
      console.log('4. Copy ALL the SQL code');
      console.log('5. Paste into Supabase SQL Editor');
      console.log('6. Click "Run" (or press Ctrl/Cmd + Enter)\n');
      return;
    }
    
    console.log('✅ Contract trigger fixed successfully!');
    console.log('\nThe error "record old has no field deadline" should now be resolved.');
    console.log('You can now sign contracts without errors.\n');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
    console.log('\n⚠️  MANUAL FIX REQUIRED:');
    console.log('\n1. Go to: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Click "SQL Editor" in the sidebar');
    console.log('4. Click "New Query"');
    console.log('5. Copy the contents from FIX_CONTRACT_TRIGGER.sql');
    console.log('6. Paste into the editor');
    console.log('7. Click "Run" button\n');
  }
}

console.log('========================================');
console.log('📋 INSTRUCTIONS');
console.log('========================================\n');
console.log('Since the script cannot execute SQL directly,');
console.log('please follow these steps:\n');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select your project');
console.log('3. Click "SQL Editor" in the left sidebar');
console.log('4. Click "New Query" button');
console.log('5. Open the file: FIX_CONTRACT_TRIGGER.sql');
console.log('6. Copy ALL the SQL code');
console.log('7. Paste into the Supabase SQL Editor');
console.log('8. Click "Run" button (or press Ctrl/Cmd + Enter)');
console.log('9. Wait for "Success" message\n');
console.log('This will fix the "deadline" field error.\n');
console.log('========================================\n');
