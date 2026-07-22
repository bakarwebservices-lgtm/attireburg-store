const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: products, error } = await supabase.from('Product').select('id, name, images').limit(10);
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  console.log('=== PRODUCT IMAGES IN DB ===\n');
  for (const p of products) {
    console.log(`Product: "${p.name}"`);
    console.log(`ID: ${p.id}`);
    console.log(`Images count: ${p.images ? p.images.length : 0}`);
    console.log(`Images:`, p.images);
    console.log('--------------------------------------------------');
  }

  // Also check ProductVariant images for a couple products
  const { data: variants } = await supabase.from('ProductVariant').select('id, sku, images, productId').limit(5);
  console.log('\n=== SAMPLE PRODUCT VARIANT IMAGES ===\n');
  for (const v of variants) {
    console.log(`Variant SKU: ${v.sku}`);
    console.log(`Images count: ${v.images ? v.images.length : 0}`);
    console.log(`Images:`, v.images);
    console.log('--------------------------------------------------');
  }
}

check();
