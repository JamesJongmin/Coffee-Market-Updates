const https = require('https');
const fs = require('fs');

const COUNTRIES = {
  china:     { code: 156, name: '중국',       nameEn: 'China' },
  malaysia:  { code: 458, name: '말레이시아', nameEn: 'Malaysia' },
  indonesia: { code: 360, name: '인도네시아', nameEn: 'Indonesia' },
  thailand:  { code: 764, name: '태국',       nameEn: 'Thailand' },
  vietnam:   { code: 704, name: '베트남',     nameEn: 'Vietnam' },
  japan:     { code: 392, name: '일본',       nameEn: 'Japan' },
  korea:     { code: 410, name: '한국',       nameEn: 'Korea' }
};

const HS_CODE = '1518';

function buildPeriods() {
  const periods = [];
  for (let m = 1; m <= 12; m++) periods.push(`2024${String(m).padStart(2,'0')}`);
  for (let m = 1; m <= 12; m++) periods.push(`2025${String(m).padStart(2,'0')}`);
  periods.push('202601', '202602');
  return periods;
}

function fetchComtrade(reporterCode, period) {
  return new Promise((resolve, reject) => {
    const url = `https://comtradeapi.un.org/public/v1/preview/C/M/HS?cmdCode=${HS_CODE}&flowCode=X&reporterCode=${reporterCode}&period=${period}&partnerCode=0`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.data && parsed.data.length > 0) {
            const d = parsed.data[0];
            const fob = d.fobvalue || d.primaryValue;
            const wgt = d.netWgt;
            const unitPrice = (fob && wgt && wgt > 0) ? Math.round(fob / (wgt / 1000)) : null; // $/MT
            resolve({
              period,
              fobValue: fob,
              netWgtKg: wgt,
              netWgtMT: wgt ? Math.round(wgt / 1000) : null,
              unitPricePerMT: unitPrice,
              isEstimated: d.isQtyEstimated || d.isNetWgtEstimated,
              isReported: d.isReported
            });
          } else {
            resolve({ period, fobValue: null, netWgtKg: null, netWgtMT: null, unitPricePerMT: null, noData: true });
          }
        } catch (e) {
          resolve({ period, error: e.message });
        }
      });
    }).on('error', (e) => {
      resolve({ period, error: e.message });
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const periods = buildPeriods();
  const results = {};
  
  for (const [key, country] of Object.entries(COUNTRIES)) {
    console.log(`\n=== Fetching ${country.nameEn} (${country.code}) ===`);
    results[key] = { ...country, monthly: {} };
    
    for (const period of periods) {
      process.stdout.write(`  ${period}...`);
      try {
        const data = await fetchComtrade(country.code, period);
        results[key].monthly[period] = data;
        if (data.unitPricePerMT) {
          process.stdout.write(` $${data.unitPricePerMT}/MT (${data.netWgtMT} MT)\n`);
        } else if (data.noData) {
          process.stdout.write(` no data\n`);
        } else if (data.error) {
          process.stdout.write(` error: ${data.error}\n`);
        } else {
          process.stdout.write(` incomplete\n`);
        }
      } catch (e) {
        process.stdout.write(` FAILED: ${e.message}\n`);
        results[key].monthly[period] = { period, error: e.message };
      }
      await sleep(1200); // Rate limit: ~1 request per second
    }
  }
  
  // Save raw results
  fs.writeFileSync('/workspace/scripts/uco-comtrade-raw.json', JSON.stringify(results, null, 2));
  console.log('\nRaw data saved to scripts/uco-comtrade-raw.json');
  
  // Generate summary
  console.log('\n\n========================================');
  console.log('SUMMARY: HS 1518 Unit FOB Price ($/MT)');
  console.log('========================================');
  console.log('Source: UN Comtrade (comtradeapi.un.org)');
  console.log('HS Code: 1518 (Animal/vegetable fats & oils, chemically modified)');
  console.log('Flow: Exports (FOB)');
  console.log('Unit Price = FOB Value / Net Weight');
  console.log('========================================\n');
  
  const header = ['Period', ...Object.keys(COUNTRIES).map(k => COUNTRIES[k].nameEn)];
  console.log(header.join('\t'));
  
  for (const period of periods) {
    const row = [period];
    for (const key of Object.keys(COUNTRIES)) {
      const d = results[key].monthly[period];
      row.push(d && d.unitPricePerMT ? `$${d.unitPricePerMT}` : '-');
    }
    console.log(row.join('\t'));
  }
  
  // Generate the data in format ready for chart integration
  const chartData = {};
  for (const [key, country] of Object.entries(results)) {
    chartData[key] = {
      label: country.name,
      nameEn: country.nameEn,
      prices: {},
      volumes: {}
    };
    for (const period of periods) {
      const d = country.monthly[period];
      if (d && d.unitPricePerMT) {
        chartData[key].prices[period] = d.unitPricePerMT;
        chartData[key].volumes[period] = d.netWgtMT;
      }
    }
  }
  
  fs.writeFileSync('/workspace/scripts/uco-prices-chart-data.json', JSON.stringify(chartData, null, 2));
  console.log('\nChart-ready data saved to scripts/uco-prices-chart-data.json');
}

main().catch(console.error);
