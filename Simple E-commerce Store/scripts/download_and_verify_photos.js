const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const productsDir = path.join(__dirname, '..', 'client', 'images', 'products');
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// Map of SKU to verified photographic image URLs (Unsplash photo IDs with genuine studio/product photography)
const catalogPhotos = {
  // === GLASSES & LENS (12 products) ===
  'SKU-GL-001': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=85', // Polarized Anti-Glare Driving Glasses
  'SKU-GL-002': 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=85', // Precision Anti-Reflective Reading Glasses
  'SKU-GL-003': 'LOCAL_ARTIFACT_contact_lenses', // Colored Cosmetic Contact Lenses 2-Pack
  'SKU-GL-004': 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=85', // Square Oversized Gradient Sunglasses
  'SKU-GL-005': 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=85', // Flexible TR90 Lightweight Frames
  'SKU-GL-006': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=85', // Vintage Gradient Round Sunglasses
  'SKU-GL-007': 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=85', // Ultra-Light Memory Titanium Glasses
  'SKU-GL-008': 'LOCAL_IMAGE_contact_lenses_pkg', // Hydration Plus Monthly Contact Lenses
  'SKU-GL-009': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=85', // Mirrored Silver Aviator Sunglasses
  'SKU-GL-010': 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=85', // Rimless Diamond Cut Reading Glasses
  'SKU-GL-011': 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=85', // Classic Matte Black Wayfarer Sunglasses
  'SKU-GL-012': 'https://images.unsplash.com/photo-1582142839970-2b9da1374f67?auto=format&fit=crop&w=600&q=85', // Blue Light Blocking Computer Glasses

  // === WINTER WEAR (12 products) ===
  'SKU-WW-001': 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=600&q=85', // Merino Wool Cable Knit Scarf
  'SKU-WW-002': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=85', // Men's Heavyweight Fleece Hoodie
  'SKU-WW-003': 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=85', // Thermal Puffer Down Winter Jacket
  'SKU-WW-004': 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=85', // Chunky Fisherman Wool Sweater
  'SKU-WW-005': 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=85', // Arctic Stormproof Down Parka
  'SKU-WW-006': 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=85', // Waterproof Ski & Snowboard Jacket
  'SKU-WW-007': 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=85', // Double-Breasted Wool Overcoat
  'SKU-WW-008': 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=85', // Ribbed Merino Wool Beanie
  'SKU-WW-009': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=85', // Insulated Waterproof Winter Gloves
  'SKU-WW-010': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=85', // Shearling Aviator Leather Jacket
  'SKU-WW-011': 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=85', // Quilted Lightweight Down Vest
  'SKU-WW-012': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=85', // Thermal Fleece-Lined Joggers

  // === DRESS & FROCK (12 products) ===
  'SKU-DR-001': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=85', // Black Floral Wrap Maxi Dress
  'SKU-DR-002': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=85', // Girls Pink Embroidered A-Line Dress
  'SKU-DR-003': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=85', // Women's Velvet Evening Party Gown
  'SKU-DR-004': 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=85', // Bohemian Chiffon Summer Sundress
  'SKU-DR-005': 'https://images.unsplash.com/photo-1568252542512-9fe8fe9c87bb?auto=format&fit=crop&w=600&q=85', // Classic Polka Dot Cotton Frock
  'SKU-DR-006': 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=600&q=85', // Vintage sweetheart Cocktail Dress
  'SKU-DR-007': 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&w=600&q=85', // Emerald Green Satin Slip Dress
  'SKU-DR-008': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=85', // Tiered Ruffle Pastel Midi Dress
  'SKU-DR-009': 'https://images.unsplash.com/photo-1596783074918-c84cb06531ca?auto=format&fit=crop&w=600&q=85', // Lace Applique Mermaid Evening Gown
  'SKU-DR-010': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=85', // Pleated Chiffon Tiered Dress
  'SKU-DR-011': 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?auto=format&fit=crop&w=600&q=85', // Off-Shoulder Scarlet Party Dress
  'SKU-DR-012': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=85', // Boho Beach Floral Maxi Dress

  // === SHORTS & JEANS (12 products) ===
  'SKU-SJ-001': 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=85', // Men's Slim Fit Stretch Denim Jeans
  'SKU-SJ-002': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=85', // Classic Distressed Washed Denim Shorts
  'SKU-SJ-003': 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=85', // High-Waisted Straight Leg Jeans
  'SKU-SJ-004': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=85', // Vintage Ripped Knee Denim Jeans
  'SKU-SJ-005': 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=85', // Multi-Pocket Tactical Cargo Shorts
  'SKU-SJ-006': 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&w=600&q=85', // Baggy Wide-Leg Skater Jeans
  'SKU-SJ-007': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=85', // Frayed Hem Summer Cutoff Shorts (will replace with unique)
  'SKU-SJ-008': 'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=600&q=85', // Japanese Selvedge Raw Denim Jeans
  'SKU-SJ-009': 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=600&q=85', // Relaxed Tapered Indigo Jeans
  'SKU-SJ-010': 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=600&q=85', // Linen Blend Drawstring Casual Shorts
  'SKU-SJ-011': 'https://images.unsplash.com/photo-1560243563-062bfc001d68?auto=format&fit=crop&w=600&q=85', // Athletic Stretch Chino Shorts
  'SKU-SJ-012': 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=85', // Acid Wash Vintage Relaxed Jeans

  // === CORE ELECTRONICS & HOME & FASHION & ACCESSORIES ===
  'SKU-EL-001': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=85', // Wireless Noise-Cancelling Headphones
  'SKU-EL-002': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=85', // Smart Fitness Watch Tracker
  'SKU-EL-003': 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=85', // Ultra HD Action Camera
  'SKU-EL-004': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=85', // Portable Bluetooth Speaker
  'SKU-EL-005': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=85', // Ergonomic Wireless Gaming Mouse
  'SKU-EL-006': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=85', // Mechanical RGB Backlit Keyboard

  'SKU-FS-001': 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=85', // Genuine Leather Bifold Wallet
  'SKU-FS-002': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=85', // Classic Canvas Casual Sneakers
  'SKU-FS-003': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85', // Handcrafted Full-Grain Leather Belt
  'SKU-FS-004': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=85', // Retro Polarized Fashion Sunglasses

  'SKU-AC-001': 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=85', // Minimalist Stainless Steel Watch
  'SKU-AC-002': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=85', // Sterling Silver Pendant Necklace
  'SKU-AC-003': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=85', // Water-Resistant Commuter Backpack
  'SKU-AC-004': 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=85', // Polarized Classic Aviator Sunglasses

  'SKU-HM-001': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=85', // Modern Ceramic Table Lamp
  'SKU-HM-002': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=85', // Ultra-Soft Microfiber Bedding Set
  'SKU-HM-003': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=85', // Stainless Steel Thermal Travel Mug
  'SKU-HM-004': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=85'  // Aromatherapy Essential Oil Diffuser
};

console.log('Total catalog targets:', Object.keys(catalogPhotos).length);
