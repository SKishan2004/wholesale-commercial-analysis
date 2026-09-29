import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

async function generateSampleExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Telecom Wholesale Commercial Analysis System';
  workbook.created = new Date();

  // -------------------------------------------------------------
  // Sheet 1: Traffic_Commercial_Data
  // -------------------------------------------------------------
  const sheet = workbook.addWorksheet('Traffic_Commercial_Data', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer_ID', key: 'customer_id', width: 15 },
    { header: 'Customer_Name', key: 'customer_name', width: 20 },
    { header: 'Operator_Code', key: 'operator_code', width: 16 },
    { header: 'Operator_Name', key: 'operator_name', width: 20 },
    { header: 'Carrier_Code', key: 'carrier_code', width: 16 },
    { header: 'Carrier_Name', key: 'carrier_name', width: 20 },
    { header: 'Source_Country', key: 'source_country', width: 18 },
    { header: 'Destination_Country', key: 'dest_country', width: 18 },
    { header: 'Region', key: 'region', width: 16 },
    { header: 'Route_Code', key: 'route_code', width: 18 },
    { header: 'Submarine_Cable', key: 'cable', width: 18 },
    { header: 'Traffic_Direction', key: 'direction', width: 16 },
    { header: 'Outgoing_Minutes', key: 'outgoing_mins', width: 18 },
    { header: 'Incoming_Minutes', key: 'incoming_mins', width: 18 },
    { header: 'Outgoing_Share', key: 'outgoing_share', width: 16 },
    { header: 'Incoming_Share', key: 'incoming_share', width: 16 },
    { header: 'Incoming_Revenue_Rate', key: 'inc_rev_rate', width: 22 },
    { header: 'Outgoing_Cost_Rate', key: 'out_cost_rate', width: 20 },
    { header: 'Outgoing_Revenue_Per_Min', key: 'out_rev_rate', width: 24 },
    { header: 'Interconnect_Rate', key: 'interconnect_rate', width: 18 },
    { header: 'Cable_Capacity_Cost', key: 'cable_cost', width: 20 },
    { header: 'Currency', key: 'currency', width: 12 }
  ];

  // Format Header Row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' } // Slate 800
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Sample data generation
  const records = [];

  // ROW 1: Manager's Exact Sample Scenario
  records.push({
    date: '2026-09-01',
    customer_id: 'CUST-001',
    customer_name: 'Airtel India',
    operator_code: 'OP-VOD-UK',
    operator_name: 'Vodacom UK',
    carrier_code: 'CARRIER-A',
    carrier_name: 'Carrier A Telecom',
    source_country: 'India',
    dest_country: 'United Kingdom',
    region: 'Europe',
    route_code: 'ROUTE-IND-UK',
    cable: 'SEA-ME-WE 5',
    direction: 'BOTH',
    outgoing_mins: 100000,
    incoming_mins: 200000,
    outgoing_share: 0.60,
    incoming_share: 0.50,
    inc_rev_rate: 0.50,
    out_cost_rate: 0.70,
    out_rev_rate: 1.00,
    interconnect_rate: 0.00,
    cable_cost: 0,
    currency: 'INR'
  });

  // ROW 2: Carrier B Scenario (Loss Making Test Scenario)
  records.push({
    date: '2026-09-01',
    customer_id: 'CUST-002',
    customer_name: 'Jio Infocomm',
    operator_code: 'OP-ATT-US',
    operator_name: 'AT&T Mobility',
    carrier_code: 'CARRIER-B',
    carrier_name: 'Carrier B Global',
    source_country: 'India',
    dest_country: 'United States',
    region: 'North America',
    route_code: 'ROUTE-IND-US',
    cable: 'AAE-1',
    direction: 'OUTGOING',
    outgoing_mins: 150000,
    incoming_mins: 20000,
    outgoing_share: 0.80,
    incoming_share: 0.20,
    inc_rev_rate: 0.15,
    out_cost_rate: 0.95,
    out_rev_rate: 0.80,
    interconnect_rate: 0.04,
    cable_cost: 2000,
    currency: 'INR'
  });

  // Generate 50 realistic rows spanning dates in Sept 2026
  const customers = [
    { id: 'CUST-001', name: 'Airtel India' },
    { id: 'CUST-002', name: 'Jio Infocomm' },
    { id: 'CUST-003', name: 'Vodafone Idea' },
    { id: 'CUST-004', name: 'BSNL Enterprise' }
  ];

  const carriers = [
    { code: 'CARRIER-A', name: 'Carrier A Telecom' },
    { code: 'CARRIER-B', name: 'Carrier B Global' },
    { code: 'CARRIER-C', name: 'Carrier C Networks' },
    { code: 'CARRIER-D', name: 'Carrier D Direct' }
  ];

  const routes = [
    { code: 'ROUTE-IND-UK', src: 'India', dst: 'United Kingdom', reg: 'Europe', cable: 'SEA-ME-WE 5' },
    { code: 'ROUTE-IND-US', src: 'India', dst: 'United States', reg: 'North America', cable: 'AAE-1' },
    { code: 'ROUTE-IND-UAE', src: 'India', dst: 'United Arab Emirates', reg: 'Middle East', cable: 'FALCON' },
    { code: 'ROUTE-IND-SGP', src: 'India', dst: 'Singapore', reg: 'Asia Pacific', cable: 'APG' },
    { code: 'ROUTE-IND-DEU', src: 'India', dst: 'Germany', reg: 'Europe', cable: 'EIG' }
  ];

  const operators = [
    { code: 'OP-VOD-UK', name: 'Vodacom UK' },
    { code: 'OP-ATT-US', name: 'AT&T Mobility' },
    { code: 'OP-ETI-UAE', name: 'Etisalat UAE' },
    { code: 'OP-SING-SGP', name: 'Singtel' },
    { code: 'OP-DT-DEU', name: 'Deutsche Telekom' }
  ];

  for (let day = 1; day <= 15; day++) {
    const dateStr = `2026-09-${day < 10 ? '0' + day : day}`;
    
    routes.forEach((rt, index) => {
      const cust = customers[index % customers.length];
      const carr = carriers[(day + index) % carriers.length];
      const op = operators[index % operators.length];

      const outMins = Math.floor(50000 + Math.random() * 100000);
      const incMins = Math.floor(60000 + Math.random() * 120000);

      const outShare = parseFloat((0.40 + Math.random() * 0.50).toFixed(2));
      const incShare = parseFloat((0.35 + Math.random() * 0.55).toFixed(2));

      const incRevRate = parseFloat((0.30 + Math.random() * 0.40).toFixed(2));
      const outCostRate = parseFloat((0.40 + Math.random() * 0.45).toFixed(2));
      const outRevRate = parseFloat((0.80 + Math.random() * 0.60).toFixed(2));

      records.push({
        date: dateStr,
        customer_id: cust.id,
        customer_name: cust.name,
        operator_code: op.code,
        operator_name: op.name,
        carrier_code: carr.code,
        carrier_name: carr.name,
        source_country: rt.src,
        dest_country: rt.dst,
        region: rt.reg,
        route_code: rt.code,
        cable: rt.cable,
        direction: index % 2 === 0 ? 'BOTH' : 'OUTGOING',
        outgoing_mins: outMins,
        incoming_mins: incMins,
        outgoing_share: outShare,
        incoming_share: incShare,
        inc_rev_rate: incRevRate,
        out_cost_rate: outCostRate,
        out_rev_rate: outRevRate,
        interconnect_rate: 0.02,
        cable_cost: index === 0 ? 500 : 0,
        currency: 'INR'
      });
    });
  }

  records.forEach((r) => sheet.addRow(r));

  // -------------------------------------------------------------
  // Sheet 2: Operator_Master
  // -------------------------------------------------------------
  const opSheet = workbook.addWorksheet('Operator_Master');
  opSheet.columns = [
    { header: 'Operator_Code', key: 'code', width: 20 },
    { header: 'Operator_Name', key: 'name', width: 25 },
    { header: 'Country', key: 'country', width: 20 }
  ];
  operators.forEach(o => opSheet.addRow(o));

  // Ensure data directory exists
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'sample_wholesale_data.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Sample Excel file generated successfully at: ${outputPath}`);
}

generateSampleExcel().catch(err => {
  console.error('❌ Failed to generate sample Excel:', err);
  process.exit(1);
});
