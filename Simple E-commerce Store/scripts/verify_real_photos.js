const https = require('https');
const fs = require('fs');
const path = require('path');

// Helper to test if an image URL is alive (HTTP 200)
function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { method: 'HEAD', timeout: 6000 }, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch (e) {
      resolve(false);
    }
  });
}

// Pool of candidate real Unsplash product & fashion photography IDs
const candidateDresses = [
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
  'photo-1512436991641-6745cdb1723f',
  'photo-1503342394128-c104d54dba01',
  'photo-1556905055-8f358a7a47b2'
];

async function run() {
  console.log('Testing candidates...');
  const validDresses = [];
  for (const id of candidateDresses) {
    const url = `https://images.unsplash.com/${id}?w=500&h=500&fit=crop&q=80`;
    const ok = await checkUrl(url);
    if (ok) {
      validDresses.push(id);
    }
  }
  console.log(`Validated ${validDresses.length} / ${candidateDresses.length} candidate dresses.`);
}

run();
