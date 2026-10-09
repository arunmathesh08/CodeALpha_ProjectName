const https = require('https');
const fs = require('fs');
const path = require('path');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { method: 'HEAD', timeout: 3500 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch (e) {
      resolve(false);
    }
  });
}

// Full candidate pool of real product photography IDs
const photoPool = {
  // DRESSES & FROCKS
  dresses: [
    'photo-1595777457583-95e059d581b8',
    'photo-1572804013309-59a88b7e92f1',
    'photo-1566174053879-31528523f8ae',
    'photo-1515372039744-b8f02a3ae446',
    'photo-1568252542512-9fe8fe9c87bb',
    'photo-1518895949257-7621c3c786d7',
    'photo-1612423284934-2850a4ea6b0f',
    'photo-1576995853123-5a10305d93c0',
    'photo-1596783074918-c84cb06531ca',
    'photo-1529139574466-a303027c1d8b',
    'photo-1550614000-4895a10e1bfd',
    'photo-1496747611176-843222e1e57c',
    'photo-1524504388940-b1c1722653e1',
    'photo-1564557287817-3785e38ec1f5',
    'photo-1589465885857-44edb59bbff2',
    'photo-1617019114583-affb34d1b3cd',
    'photo-1534126511673-b6899657816a',
    'photo-1517841905240-472988babdf9',
    'photo-1520591799316-6b30425429aa',
    'photo-1485230895905-ec40ba36b9bc',
    'photo-1554412933-514a83d2f3c8',
    'photo-1516762689617-e1cffcef479d',
    'photo-1574634534894-89d7576c8259',
    'photo-1581044777550-4cfa60707c03',
    'photo-1508427953056-b00b8d78ebf5',
    'photo-1523381294911-8d3cead13475',
    'photo-1509631179647-0177331693ae',
    'photo-1549060279-7e168fcee0c2',
    'photo-1558769132-cb1aea458c5e',
    'photo-1562157873-818bc0726f68',
    'photo-1544441893-675973e31985',
    'photo-1485968579580-b6d095142e6e',
    'photo-1508746829417-e6f548d8d6ed',
    'photo-1469334031218-e382a71b716b',
    'photo-1552374196-1ab2a1c593e8',
    'photo-1490481651871-ab68de25d43d',
    'photo-1492707892479-7bc8d5a4ee93',
    'photo-1521572267360-ee0c2909d518',
    'photo-1519748771451-a94c5963879f',
    'photo-1551803091-e20673f15770',
    'photo-1541099649105-f69ad21f3246',
    'photo-1534030347209-467a5b0ad3e6',
    'photo-1585487000160-6ebcfceb0d03',
    'photo-1583496661160-fb5886a0aaaa',
    'photo-1502716119720-b23a93e5fe1b',
    'photo-1539109136881-3be0616acf4b',
    'photo-1503342217505-b0a15ec3261c',
    'photo-1534528741775-53994a69daeb',
    'photo-1515886657613-9f3515b0c78f',
    'photo-1509551388413-e18d0ac5d495',
    'photo-1548883354-7622d03aca27',
    'photo-1525450824786-227cbef70703',
    'photo-1513094735237-8f2714d57c13',
    'photo-1503342394128-c104d54dba01',
    'photo-1532712938310-34cb3982ef74'
  ],

  // WINTER WEAR
  winter: [
    'photo-1608256246200-53e635b5b65f', // Cable knit scarf
    'photo-1556905055-8f358a7a47b2', // Heavyweight fleece hoodie
    'photo-1544923246-77307dd654cb', // Puffer down jacket
    'photo-1434389677669-e08b4cac3105', // Fisherman wool sweater
    'photo-1516257984-b1b4d707412e', // Hooded snow parka
    'photo-1620799140408-edc6dcb6d633', // Turtleneck pullover
    'photo-1578587018452-892bacefd3f2', // Ski jacket
    'photo-1507679799987-c73779587ccf', // Down winter vest
    'photo-1551028719-00167b16eac5', // Polar fleece trousers
    'photo-1520903920243-00d872a2d1c9', // Fringe scarf
    'photo-1539533018447-63fcce667823', // Wool overcoat
    'photo-1548883354-93b5a1f6a1d4', // Mountain parka
    'photo-1576871337622-98d48d1cf531', // Ribbed beanie
    'photo-1588850561407-ed78c282e89b', // Ski gloves
    'photo-1521223890158-f9f7c3d5d504', // Aviator jacket
    'photo-1483985988355-763728e1935b', // Chunky cardigan
    'photo-1576566588028-4147f3842f27', // Thermal base top
    'photo-1516826957135-700dedea698c', // Trucker jacket
    'photo-1508296695146-257a814070b4', // Wool peacoat
    'photo-1618354691373-d851c5c3a990', // Breathable pullover
    'photo-1544022613-e87ca75a784a', // Expedition down parka
    'photo-1584917865442-de89df76afd3', // Honeycomb wool sweater
    'photo-1542272604-780c96856592', // Neck gaiter
    'photo-1559551409-dadc959f76b8', // Long trench coat
    'photo-1520975661595-6453be3f7070', // Storm anorak
    'photo-1512436991641-6745cdb1723f', // Zip front jacket
    'photo-1489987707025-afc232f7ea0f', // Melton wool peacoat
    'photo-1578632767115-351597cf2477', // Fair isle sweater
    'photo-1556821840-3a63f95609a7', // Bomber jacket
    'photo-1576871337632-b9aef4c17ab9', // Balaclava
    'photo-1601924994987-69e26d50dc26', // Infinity loop scarf
    'photo-1602810318383-e386cc2a3ccf', // Winter trench
    'photo-1506152983158-b4a74a01c721', // Windbreaker
    'photo-1543163521-1bf539c55dd2', // Fur trim jacket
    'photo-1484186139897-d5fc6b908812', // Longline coat
    'photo-1517841905240-472988babdf8', // Thermal crewneck
    'photo-1515886657613-9f3515b0c78a', // Sport warm top
    'photo-1544441893-675973e31985', // Woolen vest
    'photo-1508746829417-e6f548d8d6ed', // Winter layer
    'photo-1490481651871-ab68de25d43d', // Cashmere trench
    'photo-1519748771451-a94c5963879f', // Evening winter wrap
    'photo-1534030347209-467a5b0ad3e6', // Wool poncho
    'photo-1502716119720-b23a93e5fe1b', // Yellow winter knit
    'photo-1539109136881-3be0616acf4b', // Street winter jacket
    'photo-1503342217505-b0a15ec3261c', // Casual winter top
    'photo-1534528741775-53994a69daeb', // Winter portrait outfit
    'photo-1509551388413-e18d0ac5d495', // Lilac winter coat
    'photo-1548883354-7622d03aca27', // Mountain jacket
    'photo-1525450824786-227cbef70703', // Woolen dress coat
    'photo-1513094735237-8f2714d57c13', // Embroidered winter knit
    'photo-1503342394128-c104d54dba01', // White knit hoodie
    'photo-1532712938310-34cb3982ef74', // Chic winter coat
    'photo-1520639888713-7851133b1ed0', // Winter trail runner
    'photo-1515488042361-ee00e0ddd4e4', // Warm fleece bootie
    'photo-1553062407-98eeb64c6a62', // Waterproof winter backpack
    'photo-1599643478518-a784e5dc4c8f', // Silver pendant
    'photo-1592945403244-b3fbafd7f539', // Luxury scent
    'photo-1624222247344-550fb60583dc'  // Leather belt
  ]
};

async function run() {
  console.log('Testing pools in parallel...');
  for (const cat in photoPool) {
    const list = photoPool[cat];
    const results = await Promise.all(list.map(async id => {
      const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=80`;
      const ok = await checkUrl(url);
      return ok ? id : null;
    }));
    const valid = results.filter(Boolean);
    console.log(`${cat}: ${valid.length} / ${list.length} live verified photos`);
  }
}

run();
