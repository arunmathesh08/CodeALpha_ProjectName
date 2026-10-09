const fs = require('fs');
const path = require('path');
const https = require('https');

const productsDir = path.join(__dirname, '..', 'client', 'images', 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Master map of SKU to real photographic source
const photoMap = {
  // GLASSES & LENS
  'sku-gl-001': { type: 'artifact', filename: 'driving_glasses_1789620144247.jpg' },
  'sku-gl-002': { type: 'artifact', filename: 'reading_glasses_1789620177940.jpg' },
  'sku-gl-003': { type: 'artifact', filename: 'contact_lenses_2pack_1789620207308.jpg' },
  'sku-gl-004': { type: 'url', url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-005': { type: 'url', url: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-006': { type: 'url', url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-007': { type: 'url', url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-008': { type: 'local', path: path.join(__dirname, '..', 'client', 'images', 'contact_lenses.jpg') },
  'sku-gl-009': { type: 'url', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-010': { type: 'url', url: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-011': { type: 'url', url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=85' },
  'sku-gl-012': { type: 'url', url: 'https://images.unsplash.com/photo-1582142839970-2b9da1374f67?auto=format&fit=crop&w=600&q=85' },

  // WINTER WEAR
  'sku-ww-001': { type: 'url', url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-002': { type: 'url', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-003': { type: 'url', url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-004': { type: 'url', url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-005': { type: 'url', url: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-006': { type: 'url', url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-007': { type: 'url', url: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-008': { type: 'url', url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-009': { type: 'url', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-010': { type: 'url', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-011': { type: 'url', url: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=85' },
  'sku-ww-012': { type: 'url', url: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=85' },

  // DRESS & FROCK
  'sku-dr-001': { type: 'url', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-002': { type: 'url', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-003': { type: 'url', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-004': { type: 'url', url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-005': { type: 'url', url: 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-006': { type: 'url', url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-007': { type: 'url', url: 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-008': { type: 'url', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-009': { type: 'url', url: 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-010': { type: 'url', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-011': { type: 'url', url: 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=600&q=85' },
  'sku-dr-012': { type: 'url', url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=85' },

  // SHORTS & JEANS
  'sku-sj-001': { type: 'url', url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-002': { type: 'url', url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-003': { type: 'url', url: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-004': { type: 'url', url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-005': { type: 'url', url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-006': { type: 'url', url: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-007': { type: 'url', url: 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-008': { type: 'url', url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-009': { type: 'url', url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-010': { type: 'url', url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-011': { type: 'url', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=85' },
  'sku-sj-012': { type: 'url', url: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=85' },

  // ELECTRONICS
  'sku-el-001': { type: 'url', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=85' },
  'sku-el-002': { type: 'url', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=85' },
  'sku-el-003': { type: 'url', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=85' },
  'sku-el-004': { type: 'url', url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=85' },
  'sku-el-005': { type: 'url', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=85' },
  'sku-el-006': { type: 'url', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=85' },

  // FASHION
  'sku-fs-001': { type: 'url', url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=85' },
  'sku-fs-002': { type: 'url', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=85' },
  'sku-fs-003': { type: 'url', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85' },
  'sku-fs-004': { type: 'url', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=85' },

  // ACCESSORIES
  'sku-ac-001': { type: 'url', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=85' },
  'sku-ac-002': { type: 'url', url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=85' },
  'sku-ac-003': { type: 'url', url: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=600&q=85' },
  'sku-ac-004': { type: 'url', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=85' },

  // HOME
  'sku-hm-001': { type: 'url', url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=85' },
  'sku-hm-002': { type: 'url', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=85' },
  'sku-hm-003': { type: 'url', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=85' },
  'sku-hm-004': { type: 'url', url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=85' }
};

// Check uniqueness of URLs
const seenUrls = new Set();
let duplicates = 0;
for (const [sku, item] of Object.entries(photoMap)) {
  if (item.type === 'url') {
    const base = item.url.split('?')[0];
    if (seenUrls.has(base)) {
      console.warn(`⚠️ DUPLICATE URL found: ${sku} -> ${base}`);
      duplicates++;
    }
    seenUrls.add(base);
  }
}
if (duplicates === 0) {
  console.log('✅ All photo URLs are 100% unique!');
}

const brainDir = 'C:\\Users\\Arun\\.gemini\\antigravity-ide\\brain\\7fed2df9-95dc-439b-9cc8-250f1ac46686';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function processAll() {
  console.log(`Starting asset population for ${Object.keys(photoMap).length} items...`);
  for (const [sku, item] of Object.entries(photoMap)) {
    const dest = path.join(productsDir, `${sku}.jpg`);
    try {
      if (item.type === 'artifact') {
        const src = path.join(brainDir, item.filename);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`Copied artifact for ${sku}`);
        } else {
          console.error(`Artifact missing: ${src}`);
        }
      } else if (item.type === 'local') {
        if (fs.existsSync(item.path)) {
          fs.copyFileSync(item.path, dest);
          console.log(`Copied local image for ${sku}`);
        } else {
          console.error(`Local missing: ${item.path}`);
        }
      } else if (item.type === 'url') {
        await downloadFile(item.url, dest);
        const stats = fs.statSync(dest);
        console.log(`Downloaded ${sku}.jpg (${Math.round(stats.size / 1024)} KB)`);
      }
    } catch (err) {
      console.error(`Error processing ${sku}:`, err.message);
    }
  }

  // Summary check
  const files = fs.readdirSync(productsDir);
  console.log(`\n🎉 Total product images in ${productsDir}: ${files.length}`);
}

processAll();
