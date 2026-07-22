const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const AdmZip = require('adm-zip');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration & Flags
const isDryRun = process.argv.includes('--dry-run');
console.log(`==================================================`);
console.log(`  Attireburg Product Migration Tool`);
console.log(`  Mode: ${isDryRun ? 'DRY RUN (No changes will be saved)' : 'LIVE MIGRATION'}`);
console.log(`==================================================\n`);

const MIGRATION_DIR = __dirname;
const EXTRACT_DIR = path.join(MIGRATION_DIR, 'extracted');
const CSV_PATH = path.join(MIGRATION_DIR, 'wc-product-export-15-7-2026-1784130619607.csv');
const ZIP_2025 = path.join(MIGRATION_DIR, '2025images.zip');
const ZIP_2026 = path.join(MIGRATION_DIR, '2026images.zip');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!isDryRun && (!supabaseUrl || !supabaseKey)) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Utility functions
function generateCuid() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${randomStr}`;
}

function stripHtml(html) {
  if (!html) return '';
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up extra blank lines
  return text.split('\n').map(line => line.trim()).filter((line, i, arr) => {
    if (line === '' && i > 0 && arr[i - 1] === '') return false;
    return true;
  }).join('\n').trim();
}

function parseGermanFloat(val) {
  if (!val) return null;
  const normalized = val.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Main Migration Execution
async function runMigration() {
  // Step 1: Extract Image ZIPs if extracted folder does not exist or is incomplete
  console.log('📦 Step 1: Checking and extracting image zip files...');
  if (!fs.existsSync(EXTRACT_DIR)) {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
  }

  if (fs.existsSync(ZIP_2025)) {
    const zip2025Path = path.join(EXTRACT_DIR, '2025');
    if (!fs.existsSync(zip2025Path)) {
      console.log('   Unzipping 2025images.zip...');
      const zip = new AdmZip(ZIP_2025);
      zip.extractAllTo(zip2025Path, true);
      console.log('   ✔ 2025images.zip extracted');
    } else {
      console.log('   ✔ 2025images already extracted');
    }
  }

  if (fs.existsSync(ZIP_2026)) {
    const zip2026Path = path.join(EXTRACT_DIR, '2026');
    if (!fs.existsSync(zip2026Path)) {
      console.log('   Unzipping 2026images.zip...');
      const zip = new AdmZip(ZIP_2026);
      zip.extractAllTo(zip2026Path, true);
      console.log('   ✔ 2026images.zip extracted');
    } else {
      console.log('   ✔ 2026images already extracted');
    }
  }

  // Build local file lookup map
  console.log('\n🔍 Step 2: Indexing local image files...');
  const localFileMap = new Map(); // key: "2025/10/filename.jpg" (lowercase), value: absolute filepath

  function indexDirectory(dirPath, relativePrefix = '') {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        indexDirectory(fullPath, relPath);
      } else {
        // Normalize slashes and casing for matching
        const normKey = relPath.replace(/\\/g, '/').toLowerCase();
        localFileMap.set(normKey, fullPath);
      }
    }
  }

  indexDirectory(EXTRACT_DIR);
  console.log(`   ✔ Indexed ${localFileMap.size} local files`);

  // Step 3: Parse CSV
  console.log('\n📄 Step 3: Parsing WooCommerce CSV export...');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
    relax_column_count: true
  });

  console.log(`   ✔ Total records in CSV: ${records.length}`);

  const parents = records.filter(r => r.Type === 'variable');
  const variations = records.filter(r => r.Type === 'variation');
  console.log(`   ✔ Parent products (variable): ${parents.length}`);
  console.log(`   ✔ Variation items: ${variations.length}`);

  // Group variations by parent ID
  const parentVariationsMap = new Map();
  for (const v of variations) {
    const parentRef = v.Parent; // e.g. "id:364" or "364"
    const parentId = parentRef ? parentRef.replace('id:', '').trim() : '';
    if (!parentVariationsMap.has(parentId)) {
      parentVariationsMap.set(parentId, []);
    }
    parentVariationsMap.get(parentId).push(v);
  }

  // Step 4: Collect all required images and map WP URLs to Local File Paths
  console.log('\n🖼 Step 4: Resolving product images...');
  const urlToLocalPathMap = new Map();
  const urlToSupabasePublicUrlMap = new Map();

  for (const record of records) {
    const rawImages = record.Images || '';
    if (!rawImages) continue;
    const urls = rawImages.split(',').map(s => s.trim()).filter(Boolean);

    for (const rawUrl of urls) {
      if (urlToLocalPathMap.has(rawUrl)) continue;

      // Extract wp-content/uploads/ relative path
      const match = rawUrl.match(/wp-content\/uploads\/(.+)$/i);
      if (match) {
        let relPath = decodeURIComponent(match[1]).replace(/\\/g, '/');
        let key1 = relPath.toLowerCase(); // e.g. "2025/10/hoodie_coffee_m-edited-1.jpg"
        let key2 = relPath.replace(/^(2025|2026)\//, '$1/').toLowerCase(); // in extracted/2025/...

        let localFile = localFileMap.get(key1);
        if (!localFile) {
          // Try matching inside extracted/2025/ or extracted/2026/
          const parts = relPath.split('/');
          const year = parts[0];
          const rest = parts.slice(1).join('/');
          const altKey = `${year}/${rest}`.toLowerCase();
          localFile = localFileMap.get(altKey);
        }
        if (!localFile) {
          // Fallback 1: search by base name ignoring extension or scaled dimensions (-150x150, -600x900, -scaled, etc.)
          const baseName = path.basename(relPath).toLowerCase();
          const baseNameNoExt = baseName.replace(/\.[^/.]+$/, '');
          const cleanName = baseNameNoExt.replace(/-\d+x\d+$/, '').replace(/-scaled$/, '').replace(/-custom$/, '');

          for (const [k, fullPath] of localFileMap.entries()) {
            const fileBaseName = path.basename(k).toLowerCase();
            const fileBaseNoExt = fileBaseName.replace(/\.[^/.]+$/, '');
            if (fileBaseNoExt === baseNameNoExt || 
                fileBaseNoExt.startsWith(cleanName) || 
                cleanName.startsWith(fileBaseNoExt)) {
              // Prefer non-bk, non-scaled, non-thumbnail original images
              if (!k.includes('.bk.') && !k.match(/-\d+x\d+\./)) {
                localFile = fullPath;
                break;
              } else if (!localFile) {
                localFile = fullPath;
              }
            }
          }
        }

        if (localFile) {
          urlToLocalPathMap.set(rawUrl, localFile);
        } else {
          console.warn(`   ⚠️ Warning: Image file not found locally for URL: ${rawUrl}`);
        }
      }
    }
  }

  console.log(`   ✔ Resolved ${urlToLocalPathMap.size} unique image URLs to local files`);

  // Step 5: Upload Images to Supabase Storage (if not dry run)
  if (!isDryRun) {
    console.log('\n☁️ Step 5: Uploading images to Supabase Storage bucket "product-images"...');
    let uploadCount = 0;
    for (const [wpUrl, localPath] of urlToLocalPathMap.entries()) {
      const ext = path.extname(localPath).toLowerCase().replace('.', '') || 'jpg';
      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif'
      };
      const contentType = mimeTypes[ext] || 'image/jpeg';
      
      const fileName = `products/migrated/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const fileBuffer = fs.readFileSync(localPath);

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, fileBuffer, {
          contentType: contentType,
          upsert: true
        });

      if (error) {
        console.error(`   ❌ Failed to upload ${localPath}:`, error.message);
      } else {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path);
        
        urlToSupabasePublicUrlMap.set(wpUrl, publicUrlData.publicUrl);
        uploadCount++;
        if (uploadCount % 10 === 0 || uploadCount === urlToLocalPathMap.size) {
          console.log(`   Uploaded ${uploadCount}/${urlToLocalPathMap.size} images...`);
        }
      }
    }
    console.log(`   ✔ Successfully uploaded ${uploadCount} images to Supabase`);
  } else {
    console.log('\n☁️ Step 5: [DRY RUN] Simulating Supabase image uploads...');
    let simIdx = 1;
    for (const wpUrl of urlToLocalPathMap.keys()) {
      urlToSupabasePublicUrlMap.set(wpUrl, `https://example-supabase-storage.com/product-images/simulated-${simIdx++}.jpg`);
    }
    console.log(`   ✔ Simulated URLs created for ${urlToSupabasePublicUrlMap.size} images`);
  }

  // Step 6: Create/Ensure Categories exist
  console.log('\n📁 Step 6: Ensuring Categories exist...');
  const categoryMap = {
    'Hoodies': { name: 'Hoodies', nameEn: 'Hoodies', slug: 'hoodies' },
    'Shirts': { name: 'Shirts', nameEn: 'Shirts', slug: 'shirts' },
    'Printed Tees': { name: 'Printed Tees', nameEn: 'Printed Tees', slug: 'printed-tees' }
  };

  if (!isDryRun) {
    for (const catInfo of Object.values(categoryMap)) {
      const { data: existing } = await supabase.from('Category').select('id').eq('slug', catInfo.slug).single();
      if (!existing) {
        const newCat = {
          id: generateCuid(),
          name: catInfo.name,
          nameEn: catInfo.nameEn,
          slug: catInfo.slug,
          description: `${catInfo.name} Kollektion`,
          isActive: true,
          sortOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { error: catErr } = await supabase.from('Category').insert(newCat);
        if (catErr) console.error(`   ❌ Failed to insert category ${catInfo.name}:`, catErr.message);
        else console.log(`   ✔ Inserted category: ${catInfo.name} (slug: ${catInfo.slug})`);
      } else {
        console.log(`   ✔ Category already exists: ${catInfo.name}`);
      }
    }
  } else {
    for (const catInfo of Object.values(categoryMap)) {
      console.log(`   ✔ [DRY RUN] Category verified/created: ${catInfo.name} (${catInfo.slug})`);
    }
  }

  // Step 7: Process & Insert Products and ProductVariants
  console.log('\n🛍 Step 7: Processing and inserting Products & Variants...');

  let productCount = 0;
  let totalVariantCount = 0;

  for (let i = 0; i < parents.length; i++) {
    const parentRow = parents[i];
    const parentWpId = parentRow.ID;
    const parentIndexStr = String(i + 1).padStart(3, '0');
    
    // Parent details
    const name = parentRow.Name;
    const nameEn = ''; // As per agreement, English empty
    const description = stripHtml(parentRow.Description || parentRow['Short description']);
    const descriptionEn = '';
    
    // Category mapping
    const rawCategories = parentRow.Categories || '';
    const mainCatName = rawCategories.split(',')[0]?.trim() || 'Shirts';
    const catSlug = categoryMap[mainCatName]?.slug || slugify(mainCatName);

    // Parent Images
    const rawParentImages = (parentRow.Images || '').split(',').map(s => s.trim()).filter(Boolean);
    const parentImageUrls = rawParentImages
      .map(url => urlToSupabasePublicUrlMap.get(url))
      .filter(Boolean);

    // Parent SKU
    const parentSku = (parentRow.SKU && parentRow.SKU.trim()) ? parentRow.SKU.trim() : `ATB-PROD-${parentIndexStr}`;
    const weight = parseGermanFloat(parentRow['Weight (kg)']);
    const tags = parentRow.Tags ? parentRow.Tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Child variations
    const childVariations = parentVariationsMap.get(parentWpId) || [];
    
    // Collect sizes, colors, and calculate stock / min price from child variations
    const sizesSet = new Set();
    const colorsSet = new Set();
    const fitsSet = new Set();
    let totalStock = 0;
    let minPrice = Infinity;

    const variantRecordsToInsert = [];

    for (let j = 0; j < childVariations.length; j++) {
      const vRow = childVariations[j];
      const variantIndexStr = String(j + 1).padStart(3, '0');

      // Extract attributes from Attribute 1, 2, 3 fields
      let colorVal = null;
      let sizeVal = null;
      let fitVal = null;

      for (let k = 1; k <= 3; k++) {
        const attrName = (vRow[`Attribute ${k} name`] || '').toLowerCase();
        const attrVal = (vRow[`Attribute ${k} value(s)`] || '').trim();

        if (!attrVal) continue;

        if (attrName.includes('farbe') || attrName.includes('color')) {
          colorVal = attrVal;
          colorsSet.add(attrVal);
        } else if (attrName.includes('größe') || attrName.includes('groesse') || attrName.includes('size')) {
          sizeVal = attrVal;
          sizesSet.add(attrVal);
        } else if (attrName.includes('passform') || attrName.includes('fit')) {
          fitVal = attrVal;
          fitsSet.add(attrVal);
        }
      }

      const vPrice = parseGermanFloat(vRow['Regular price']) || 0;
      if (vPrice > 0 && vPrice < minPrice) minPrice = vPrice;

      const vStock = parseInt(vRow.Stock || '0', 10) || 0;
      totalStock += vStock;

      // Variant image
      const rawVImages = (vRow.Images || '').split(',').map(s => s.trim()).filter(Boolean);
      const vImageUrls = rawVImages
        .map(url => urlToSupabasePublicUrlMap.get(url))
        .filter(Boolean);

      const variantSku = (vRow.SKU && vRow.SKU.trim())
        ? vRow.SKU.trim()
        : `ATB-${parentIndexStr}-${variantIndexStr}`;

      const variantAttributes = {
        color: colorVal,
        size: sizeVal,
        fit: fitVal
      };

      variantRecordsToInsert.push({
        id: generateCuid(),
        // productId will be attached after parent product ID is set
        sku: variantSku,
        price: vPrice,
        salePrice: null,
        stock: vStock,
        images: vImageUrls.length > 0 ? vImageUrls : (parentImageUrls.length > 0 ? [parentImageUrls[0]] : []),
        attributes: variantAttributes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const finalPrice = (minPrice !== Infinity && minPrice > 0) ? minPrice : 39.99;
    const sizes = Array.from(sizesSet);
    const colors = Array.from(colorsSet);

    const productRecord = {
      id: generateCuid(),
      name: name,
      nameEn: nameEn,
      description: description,
      descriptionEn: descriptionEn,
      price: finalPrice,
      currency: 'EUR',
      images: parentImageUrls,
      category: catSlug,
      sizes: sizes,
      colors: colors,
      stock: totalStock,
      featured: false,
      onSale: false,
      salePrice: null,
      sku: parentSku,
      weight: weight,
      tags: tags,
      metaTitle: name,
      metaDescription: description.substring(0, 160),
      isActive: true,
      hasVariants: true,
      attributes: {
        colors: colors,
        sizes: sizes,
        fits: Array.from(fitsSet)
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Attach productId to variations
    for (const vRec of variantRecordsToInsert) {
      vRec.productId = productRecord.id;
    }

    if (!isDryRun) {
      // Insert Product
      const { error: pErr } = await supabase.from('Product').insert(productRecord);
      if (pErr) {
        console.error(`   ❌ Failed to insert product "${name}":`, pErr.message);
        continue;
      }

      // Insert Variants in batch
      if (variantRecordsToInsert.length > 0) {
        const { error: vErr } = await supabase.from('ProductVariant').insert(variantRecordsToInsert);
        if (vErr) {
          console.error(`   ❌ Failed to insert variants for "${name}":`, vErr.message);
        }
      }

      productCount++;
      totalVariantCount += variantRecordsToInsert.length;
      console.log(`   ✔ [${i + 1}/${parents.length}] Inserted: "${name}" (${variantRecordsToInsert.length} variants, Stock: ${totalStock}, Price: €${finalPrice})`);
    } else {
      productCount++;
      totalVariantCount += variantRecordsToInsert.length;
      console.log(`   ✔ [DRY RUN] [${i + 1}/${parents.length}] Parsed: "${name}" (${variantRecordsToInsert.length} variants, Stock: ${totalStock}, Price: €${finalPrice})`);
    }
  }

  console.log('\n==================================================');
  console.log(`  Migration ${isDryRun ? 'Dry Run' : 'Execution'} Finished!`);
  console.log(`  Summary:`);
  console.log(`  - Products Processed: ${productCount}`);
  console.log(`  - Variants Processed: ${totalVariantCount}`);
  console.log(`  - Images Resolved: ${urlToLocalPathMap.size}`);
  console.log('==================================================\n');
}

runMigration().catch(err => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
