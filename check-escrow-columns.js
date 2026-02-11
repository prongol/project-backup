
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEscrowTable() {
  console.log('Checking escrow_accounts table columns...');
  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching escrow_accounts:', error);
  } else {
    console.log('Columns in escrow_accounts:', Object.keys(data[0] || {}));
  }

  console.log('\nChecking contract join...');
  const { data: contractData, error: contractError } = await supabase
    .from('contracts')
    .select(`
      id, client_id, freelancer_id,
      freelancers(id, stripe_connect_account_id),
      clients(id, profile_id, stripe_customer_id)
    `)
    .limit(1);

  if (contractError) {
    console.error('Error fetching contract join:', contractError);
  } else {
    console.log('Contract join successful:', JSON.stringify(contractData[0], null, 2));
  }
}

checkEscrowTable();
