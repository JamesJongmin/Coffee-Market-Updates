const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('/workspace/scripts/uco-comtrade-raw.json', 'utf8'));

const MIN_VOLUME_MT = 500;

function cleanCountryData(key, country) {
  const cleaned = {
    label: country.name,
    nameEn: country.nameEn,
    data: [],
    periods: [],
    dataSource: 'UN Comtrade',
    hsCode: 'HS 1518',
    notes: []
  };
  
  const periods2024 = [];
  const periods2025 = [];
  
  for (let m = 1; m <= 12; m++) {
    const p24 = `2024${String(m).padStart(2,'0')}`;
    const p25 = `2025${String(m).padStart(2,'0')}`;
    periods2024.push(p24);
    periods2025.push(p25);
  }
  periods2024.push(...periods2025, '202601', '202602');
  
  let validCount = 0;
  let totalCount = 0;
  
  for (const period of periods2024) {
    totalCount++;
    const d = country.monthly[period];
    
    if (!d || d.noData || d.error || !d.unitPricePerMT) {
      cleaned.data.push(null);
      cleaned.periods.push(period);
      continue;
    }
    
    const volMT = d.netWgtMT || 0;
    const price = d.unitPricePerMT;
    
    // Filter: volume must be meaningful, price must be in reasonable UCO range
    const isReasonablePrice = price >= 500 && price <= 1500;
    const hasVolume = volMT >= MIN_VOLUME_MT;
    
    if (isReasonablePrice && hasVolume) {
      cleaned.data.push(price);
      cleaned.periods.push(period);
      validCount++;
    } else if (isReasonablePrice && volMT > 0) {
      // Low volume but reasonable price - mark as low confidence
      cleaned.data.push(price);
      cleaned.periods.push(period);
      cleaned.notes.push(`${period}: low volume (${volMT} MT)`);
      validCount++;
    } else {
      cleaned.data.push(null);
      cleaned.periods.push(period);
      if (d.unitPricePerMT) {
        cleaned.notes.push(`${period}: filtered out (price=$${price}, vol=${volMT}MT)`);
      }
    }
  }
  
  cleaned.coverage = `${validCount}/${totalCount} months`;
  return cleaned;
}

const ALL_PERIODS = [];
for (let m = 1; m <= 12; m++) ALL_PERIODS.push(`2024${String(m).padStart(2,'0')}`);
for (let m = 1; m <= 12; m++) ALL_PERIODS.push(`2025${String(m).padStart(2,'0')}`);
ALL_PERIODS.push('202601', '202602');

const PERIOD_LABELS = ALL_PERIODS.map(p => {
  const y = p.substring(2,4);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const m = parseInt(p.substring(4,6)) - 1;
  return `${months[m]} ${y}`;
});

const result = { 
  source: 'UN Comtrade (comtradeapi.un.org)',
  hsCode: 'HS 1518 - Animal/vegetable fats & oils, chemically modified',
  methodology: 'Unit FOB price = Total FOB export value / Net weight (kg converted to MT)',
  filters: `Minimum volume: ${MIN_VOLUME_MT} MT, Price range: $500-1500/MT`,
  fetchDate: new Date().toISOString().split('T')[0],
  periodLabels: PERIOD_LABELS,
  countries: {}
};

const KEYS = ['china', 'malaysia', 'indonesia', 'thailand', 'vietnam', 'japan', 'korea'];

for (const key of KEYS) {
  result.countries[key] = cleanCountryData(key, raw[key]);
}

// Print summary
console.log('\n============================================');
console.log('CLEANED UCO PRICE DATA (UN Comtrade, HS 1518)');
console.log('============================================\n');

const header = ['Period', ...KEYS.map(k => result.countries[k].nameEn.padEnd(12))];
console.log(header.join('\t'));
console.log('-'.repeat(120));

for (let i = 0; i < ALL_PERIODS.length; i++) {
  const row = [PERIOD_LABELS[i].padEnd(8)];
  for (const key of KEYS) {
    const val = result.countries[key].data[i];
    row.push(val ? `$${val}`.padEnd(12) : '-'.padEnd(12));
  }
  console.log(row.join('\t'));
}

console.log('\n--- Coverage ---');
for (const key of KEYS) {
  const c = result.countries[key];
  console.log(`${c.nameEn}: ${c.coverage}`);
  if (c.notes.length > 0) {
    c.notes.forEach(n => console.log(`  Note: ${n}`));
  }
}

// Generate JS-ready data for chart integration
console.log('\n\n--- Chart-Ready JavaScript Data ---\n');

const jsData = {};
for (const key of KEYS) {
  const c = result.countries[key];
  const hasData = c.data.some(d => d !== null);
  if (hasData) {
    jsData[key] = c.data;
  }
}

console.log('var COMTRADE_LABELS = ' + JSON.stringify(PERIOD_LABELS) + ';');
console.log('');
for (const [key, data] of Object.entries(jsData)) {
  console.log(`// ${result.countries[key].nameEn}: ${result.countries[key].coverage}`);
  console.log(`var ${key.toUpperCase()}_DATA = ${JSON.stringify(data)};`);
}

fs.writeFileSync('/workspace/scripts/uco-prices-cleaned.json', JSON.stringify(result, null, 2));
console.log('\n\nCleaned data saved to scripts/uco-prices-cleaned.json');
