require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateContractHistory() {
  console.log('📊 Updating contract_history change_type constraint...');
  
  // Drop existing constraint
  const dropQuery = `ALTER TABLE contract_history DROP CONSTRAINT IF EXISTS contract_history_change_type_check;`;
  
  // Add new constraint
  const addQuery = `ALTER TABLE contract_history ADD CONSTRAINT contract_history_change_type_check 
    CHECK (change_type IN (
      'created', 'edited', 'signed_client', 'signed_freelancer', 'activated', 'completed', 'cancelled',
      'work_submitted', 'work_approved', 'work_rejected', 'revision_submitted', 'dispute_filed', 'dispute_resolved'
    ));`;
  
  try {
    // Execute drop
    await supabase.rpc('execute_sql', { query: dropQuery });
    console.log('✓ Dropped old constraint');
    
    // Execute add
    await supabase.rpc('execute_sql', { query: addQuery });
    console.log('✅ Added new constraint with dispute types');
    
    console.log('\n✅ Contract history table updated successfully!');
    console.log('Available change types:');
    console.log('  - work_submitted, work_approved, work_rejected');
    console.log('  - revision_submitted');
    console.log('  - dispute_filed, dispute_resolved');
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    console.log('\n⚠️  Manual SQL update required. Run this in Supabase SQL editor:');
    console.log('\n' + dropQuery);
    console.log(addQuery);
  }
}

updateContractHistory();
