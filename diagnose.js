import 'dotenv/config';

console.log('\n🔍 SYSTEM DIAGNOSTICS\n');
console.log('='.repeat(50));

// 1. Check Stripe Configuration
console.log('\n1. STRIPE CONFIGURATION:');
const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeConnectId = process.env.STRIPE_CONNECT_CLIENT_ID;

console.log(`   Publishable Key: ${stripePublic ? '✅ Set (starts with: ' + stripePublic.substring(0, 12) + '...)' : '❌ Missing'}`);
console.log(`   Secret Key: ${stripeSecret ? '✅ Set (starts with: ' + stripeSecret.substring(0, 12) + '...)' : '❌ Missing'}`);
console.log(`   Connect Client ID: ${stripeConnectId ? '✅ Set (starts with: ' + stripeConnectId.substring(0, 12) + '...)' : '❌ Missing'}`);

// 2. Check Email Configuration
console.log('\n2. EMAIL CONFIGURATION:');
const resendKey = process.env.RESEND_API_KEY;
const disableEmails = process.env.DISABLE_EMAILS;

console.log(`   Resend API Key: ${resendKey ? '✅ Set (starts with: ' + resendKey.substring(0, 8) + '...)' : '❌ Missing'}`);
console.log(`   Emails Disabled: ${disableEmails === 'true' ? '⚠️  YES (emails won\'t send)' : '✅ No (emails active)'}`);

// 3. Check App URL
console.log('\n3. APP CONFIGURATION:');
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
console.log(`   App URL: ${appUrl}`);

// 4. Check Supabase
console.log('\n4. SUPABASE CONFIGURATION:');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set (' + supabaseUrl + ')' : '❌ Missing'}`);
console.log(`   Supabase Key: ${supabaseKey ? '✅ Set (starts with: ' + supabaseKey.substring(0, 20) + '...)' : '❌ Missing'}`);

console.log('\n' + '='.repeat(50));
console.log('\n📋 SUMMARY:\n');

const allStripe = stripePublic && stripeSecret && stripeConnectId;
const allEmail = resendKey;
const allSupabase = supabaseUrl && supabaseKey;

console.log(`   Stripe: ${allStripe ? '✅ Ready' : '❌ Incomplete - check missing keys above'}`);
console.log(`   Email: ${allEmail ? '✅ Ready' : '❌ Missing Resend key'}`);
console.log(`   Supabase: ${allSupabase ? '✅ Ready' : '❌ Missing credentials'}`);

console.log('\n' + '='.repeat(50));

if (!allStripe) {
  console.log('\n⚠️  STRIPE ISSUES DETECTED:');
  if (!stripePublic) console.log('   - Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local');
  if (!stripeSecret) console.log('   - Add STRIPE_SECRET_KEY to .env.local');
  if (!stripeConnectId) console.log('   - Add STRIPE_CONNECT_CLIENT_ID to .env.local');
  console.log('\n   Get these from: https://dashboard.stripe.com/test/apikeys');
}

if (!allEmail) {
  console.log('\n⚠️  EMAIL ISSUES DETECTED:');
  console.log('   - Add RESEND_API_KEY to .env.local');
  console.log('\n   Get this from: https://resend.com/api-keys');
}

if (!allSupabase) {
  console.log('\n⚠️  SUPABASE ISSUES DETECTED:');
  console.log('   - Check Supabase credentials in .env.local');
}

console.log('\n✨ Next Steps:');
console.log('   1. Run MINIMAL_REVIEW_SYSTEM.sql in Supabase SQL Editor');
console.log('   2. Restart dev server: npm run dev');
console.log('   3. Test payment information page as freelancer');
console.log('   4. Test rating system after completing a contract\n');
