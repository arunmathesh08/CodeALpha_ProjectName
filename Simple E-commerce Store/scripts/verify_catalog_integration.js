const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function fetchHeader(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let size = 0;
      res.on('data', chunk => size += chunk.length);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          size
        });
      });
    }).on('error', reject);
  });
}

async function runVerification() {
  console.log('🔍 Starting End-to-End Verification of ShopEase Catalog...\n');

  // 1. Check API endpoint
  const apiRes = await fetchJson('http://localhost:5000/api/products');
  if (apiRes.status !== 200 || !apiRes.data.success) {
    throw new Error(`API products failed with status ${apiRes.status}`);
  }

  const products = apiRes.data.data;
  console.log(`✅ API /api/products returned ${products.length} products (HTTP 200).`);

  // 2. Validate uniqueness
  const seenIds = new Set();
  const seenSkus = new Set();
  const seenNames = new Set();
  const seenImages = new Set();

  for (const p of products) {
    if (seenIds.has(p._id)) throw new Error(`Duplicate ID: ${p._id}`);
    seenIds.add(p._id);

    if (seenSkus.has(p.sku)) throw new Error(`Duplicate SKU: ${p.sku}`);
    seenSkus.add(p.sku);

    const nameKey = p.name.trim().toLowerCase();
    if (seenNames.has(nameKey)) throw new Error(`Duplicate Product Name: ${p.name}`);
    seenNames.add(nameKey);

    const imgKey = p.image.trim().toLowerCase();
    if (seenImages.has(imgKey)) throw new Error(`Duplicate Image Path: ${p.image}`);
    seenImages.add(imgKey);
  }
  console.log('✅ Uniqueness check PASSED: 0 duplicate IDs, 0 duplicate names, 0 duplicate images.');

  // 3. Validate every single image is served with HTTP 200 and is a real image
  console.log('\n🔍 Verifying all 66 real product image HTTP endpoints...');
  let checkedImages = 0;
  for (const p of products) {
    const imgUrl = `http://localhost:5000${p.image}`;
    const header = await fetchHeader(imgUrl);
    if (header.status !== 200) {
      throw new Error(`Image ${imgUrl} returned HTTP ${header.status}`);
    }
    if (!header.contentType || !header.contentType.startsWith('image/')) {
      throw new Error(`Image ${imgUrl} returned non-image Content-Type: ${header.contentType}`);
    }
    if (header.size < 1000) {
      throw new Error(`Image ${imgUrl} file too small: ${header.size} bytes`);
    }
    checkedImages++;
  }
  console.log(`✅ All ${checkedImages} product photograph URLs return HTTP 200 with valid image payloads.`);

  // 4. Verify categories breakdown
  const categoryMap = {};
  for (const p of products) {
    categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
  }
  console.log('\n📊 Category Breakdown:');
  for (const [cat, count] of Object.entries(categoryMap)) {
    console.log(`   - ${cat}: ${count} products`);
  }

  // 5. Verify sample user-requested items
  console.log('\n🔍 Checking requested sample items:');
  const samples = [
    'Vintage Gradient Round Sunglasses',
    'Ultra-Light Memory Titanium Glasses',
    'Hydration Plus Monthly Contact Lenses',
    'Mirrored Silver Aviator Sunglasses',
    'Black Floral Wrap Maxi Dress',
    'Girls Pink Embroidered A-Line Dress',
    "Women's Velvet Evening Party Gown",
    'Bohemian Chiffon Summer Sundress',
    'Merino Wool Cable Knit Scarf',
    "Men's Heavyweight Fleece Hoodie",
    'Thermal Puffer Down Winter Jacket',
    'Chunky Fisherman Wool Sweater'
  ];

  for (const name of samples) {
    const found = products.find(p => p.name === name);
    if (!found) {
      throw new Error(`Required sample product not found: "${name}"`);
    }
    console.log(`   ✓ [${found.category}] "${found.name}" -> ${found.image} (Stock: ${found.stock}, ₹${found.price})`);
  }

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runVerification().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});
