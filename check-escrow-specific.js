
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEscrowColumns() {
  // To get columns even if empty, we can use a query that fails or RPC
  // But let's try to just insert something and roll back? No.
  // Let's try to check the first row if it exists.
  const { data, error } = await supabase
    .from('escrow_accounts')
    .select('*')
    .limit(1);

  if (data && data.length > 0) {
    console.log('Columns in escrow_accounts:', Object.keys(data[0]));
  } else {
    // If empty, we can try to get the table definition via a join or something
    // Or just look at the error we get if we select a non-existent column
    const { error: colError } = await supabase
        .from('escrow_accounts')
        .select('platform_fee_amount')
        .limit(1);
    
    if (colError) {
        console.log('platform_fee_amount does NOT exist');
    } else {
        console.log('platform_fee_amount EXISTS');
    }
  }
}

checkEscrowColumns();
