const https = require('https');
const fs = require('fs');
const path = require('path');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const req = https.get(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    } catch (e) {
      resolve(false);
    }
  });
}

async function validateList(photoIds, label) {
  console.log(`Validating ${label} (${photoIds.length} candidates)...`);
  const valid = [];
  const promises = photoIds.map(async (id) => {
    const url = id.startsWith('http') ? id : `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=80`;
    const ok = await checkUrl(url);
    if (ok) {
      valid.push({ id, url });
    }
  });
  await Promise.all(promises);
  console.log(`✅ ${label}: ${valid.length} / ${photoIds.length} valid live real photos.`);
  return valid;
}

// 1. DRESSES (53 items)
const dressIds = [
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
  'photo-1556905055-8f358a7a47b2',
  'photo-1520639888713-7851133b1ed0'
];

// 2. WINTER WEAR (58 items)
const winterIds = [
  'photo-1608256246200-53e635b5b65f',
  'photo-1556905055-8f358a7a47b2',
  'photo-1544923246-77307dd654cb',
  'photo-1434389677669-e08b4cac3105',
  'photo-1516257984-b1b4d707412e',
  'photo-1620799140408-edc6dcb6d633',
  'photo-1578587018452-892bacefd3f2',
  'photo-1507679799987-c73779587ccf',
  'photo-1551028719-00167b16eac5',
  'photo-1520903920243-00d872a2d1c9',
  'photo-1539533018447-63fcce667823',
  'photo-1548883354-93b5a1f6a1d4',
  'photo-1576871337622-98d48d1cf531',
  'photo-1588850561407-ed78c282e89b',
  'photo-1521223890158-f9f7c3d5d504',
  'photo-1483985988355-763728e1935b',
  'photo-1576566588028-4147f3842f27',
  'photo-1516826957135-700dedea698c',
  'photo-1508296695146-257a814070b4',
  'photo-1618354691373-d851c5c3a990',
  'photo-1544022613-e87ca75a784a',
  'photo-1584917865442-de89df76afd3',
  'photo-1542272604-780c96856592',
  'photo-1559551409-dadc959f76b8',
  'photo-1520975661595-6453be3f7070',
  'photo-1512436991641-6745cdb1723f',
  'photo-1489987707025-afc232f7ea0f',
  'photo-1578632767115-351597cf2477',
  'photo-1556821840-3a63f95609a7',
  'photo-1576871337632-b9aef4c17ab9',
  'photo-1601924994987-69e26d50dc26',
  'photo-1602810318383-e386cc2a3ccf',
  'photo-1506152983158-b4a74a01c721',
  'photo-1543163521-1bf539c55dd2',
  'photo-1539533118447-63fcce667822',
  'photo-1517445312882-bc9910d016b7',
  'photo-1552374196-1ab2a1c593e7',
  'photo-1548883354-7622d03aca26',
  'photo-1517841905240-472988babdf8',
  'photo-1521223890158-f9f7c3d5d503',
  'photo-1608256246200-53e635b5b65e',
  'photo-1517445312882-bc9910d016b5',
  'photo-1544923246-77307dd654c9',
  'photo-1588850561407-ed78c282e89a',
  'photo-1584917865442-de89df76afd2',
  'photo-1516257984-b1b4d707412d',
  'photo-1434389677669-e08b4cac3104',
  'photo-1542272604-780c96856591',
  'photo-1507679799987-c73779587cc0',
  'photo-1576871337622-98d48d1cf530',
  'photo-1544022613-e87ca75a7849',
  'photo-1601924994987-69e26d50dc25',
  'photo-1548883354-93b5a1f6a1d3',
  'photo-1559551409-dadc959f76b7',
  'photo-1520975661595-6453be3f7071',
  'photo-1512436991641-6745cdb1723e',
  'photo-1489987707025-afc232f7ea0e',
  'photo-1556821840-3a63f95609a6',
  'photo-1544923246-77307dd654cc',
  'photo-1516762689617-e1cffcef479e',
  'photo-1578587018452-892bacefd3f3'
];

async function main() {
  const vDresses = await validateList(dressIds, 'Dresses');
  const vWinter = await validateList(winterIds, 'Winter');
}

main();
