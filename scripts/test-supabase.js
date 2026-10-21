import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Testing Supabase Connection ---');
console.log('Project URL:', url || '(missing)');
console.log('Anon Key:', key ? `${key.slice(0, 15)}...${key.slice(-6)}` : '(missing)');

if (!url) {
  console.error('\n❌ ERROR: VITE_SUPABASE_URL is missing in .env');
  process.exit(1);
}

if (!key || key.trim() === '') {
  console.log('\n⚠️ VITE_SUPABASE_ANON_KEY is currently empty in .env.');
  console.log('👉 To connect:');
  console.log('   1. Open your Supabase dashboard: https://supabase.com/dashboard/project/qtmoxaxonpimodwpemiy');
  console.log('   2. Click Project Settings (⚙️ gear icon) -> API');
  console.log('   3. Copy the "anon" public key (starts with eyJhbGciOi...)');
  console.log('   4. Paste it into your .env file: VITE_SUPABASE_ANON_KEY=<your_key>');
  process.exit(0);
}

try {
  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('\n❌ Supabase returned an error:', error.message);
  } else {
    console.log('\n✅ Supabase is CONNECTED successfully!');
    console.log('Client initialized and ready for sign-up and login.');
  }
} catch (err) {
  console.error('\n❌ Connection error:', err.message);
}
