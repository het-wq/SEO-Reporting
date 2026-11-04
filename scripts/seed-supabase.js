import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlFile = path.resolve(__dirname, '..', 'supabase', 'schema.sql');

const url = process.env.VITE_SUPABASE_URL || 'https://qtmoxaxonpimodwpemiy.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase Multi-Client Table Seeder ---');
console.log('Project URL:', url);
console.log('Key Status:', key ? 'Detected' : 'Missing (Required)');

if (!key) {
  console.log('\n👉 Instructions to run the schema in your Supabase Dashboard:');
  console.log('1. Go to: https://supabase.com/dashboard/project/qtmoxaxonpimodwpemiy/sql/new');
  console.log('2. Open the file: supabase/schema.sql');
  console.log('3. Copy all contents and paste into the Supabase SQL Editor.');
  console.log('4. Click "Run" (or Ctrl + Enter).');
  console.log('\nThis will create:');
  console.log('  - clients');
  console.log('  - client_keywords');
  console.log('  - brand_keywords');
  console.log('  - non_brand_keywords');
  console.log('  - seo_activities');
  console.log('  - backlink_activities');
  console.log('And seed all 7 clients: Boulder, Conscious Medicine, Besowell, Fire Master, Appliance Care, Iynix Digital, The Plumb Hero.\n');
  process.exit(0);
}

const supabase = createClient(url, key);

async function testTables() {
  const { data, error } = await supabase.from('clients').select('name, slug');
  if (error) {
    console.error('Error querying clients table:', error.message);
    console.log('Please execute supabase/schema.sql in the Supabase SQL Editor.');
  } else {
    console.log('Found clients in Supabase:');
    console.table(data);
  }
}

testTables();
