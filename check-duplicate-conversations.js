// Check for duplicate conversations between same user pairs
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDuplicates() {
  try {
    // Get all conversations
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`\n📊 Total conversations: ${conversations.length}\n`);

    // Group conversations by user pairs
    const userPairs = new Map();
    
    conversations.forEach(conv => {
      // Create a sorted key for the user pair to catch duplicates
      const key = [conv.participant_1_id, conv.participant_2_id].sort().join('|');
      
      if (!userPairs.has(key)) {
        userPairs.set(key, []);
      }
      userPairs.get(key).push(conv);
    });

    // Find duplicates
    let duplicateCount = 0;
    console.log('🔍 Checking for duplicate conversations...\n');
    
    for (const [key, convs] of userPairs) {
      if (convs.length > 1) {
        duplicateCount++;
        const [user1, user2] = key.split('|');
        console.log(`❌ DUPLICATE FOUND:`);
        console.log(`   Users: ${user1.substring(0, 8)}... ↔ ${user2.substring(0, 8)}...`);
        console.log(`   Number of conversations: ${convs.length}`);
        convs.forEach((c, i) => {
          console.log(`   ${i + 1}. ID: ${c.id.substring(0, 8)}... Created: ${c.created_at}`);
        });
        console.log('');
      }
    }

    if (duplicateCount === 0) {
      console.log('✅ No duplicate conversations found!\n');
    } else {
      console.log(`\n⚠️  Found ${duplicateCount} sets of duplicate conversations\n`);
      console.log('💡 You may want to merge these conversations and delete duplicates\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDuplicates();
