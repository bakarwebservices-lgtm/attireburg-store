const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: products, error } = await supabase.from('Product').select('id, name, images, createdAt').order('createdAt', { ascending: false }).limit(25);
  
  if (error) {
    console.error(error);
    return;
  }

  console.log('=== LATEST PRODUCTS IN DB ===\n');
  products.forEach((p, idx) => {
    console.log(`${idx + 1}. [${p.id}] "${p.name}"`);
    console.log(`   Images Count: ${p.images ? p.images.length : 0}`);
    if (p.images && p.images.length > 0) {
      console.log(`   Sample Image URL: ${p.images[0]}`);
    } else {
      console.log(`   Images: [] (Empty array)`);
    }
    console.log('');
  });
}

run();
