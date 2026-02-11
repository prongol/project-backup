
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFreelancerColumns() {
  console.log('Checking freelancers table columns...');
  const { data, error } = await supabase
    .from('freelancers')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching freelancers:', error);
  } else {
    console.log('Columns in freelancers:', Object.keys(data[0] || {}));
  }

  console.log('\nChecking clients table columns...');
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .limit(1);

  if (clientError) {
    console.error('Error fetching clients:', clientError);
  } else {
    console.log('Columns in clients:', Object.keys(clientData[0] || {}));
  }
}

checkFreelancerColumns();
