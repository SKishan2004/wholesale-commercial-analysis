import ExcelJS from 'exceljs';

export async function generateExportExcel(records: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Telecom Wholesale Commercial Analysis System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Filtered_Commercial_Analysis', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Operator', key: 'operator', width: 20 },
    { header: 'Carrier', key: 'carrier', width: 20 },
    { header: 'Route Code', key: 'route', width: 18 },
    { header: 'Destination Country', key: 'country', width: 18 },
    { header: 'Raw Outgoing Mins', key: 'rawOutMins', width: 18 },
    { header: 'Raw Incoming Mins', key: 'rawIncMins', width: 18 },
    { header: 'Calc Outgoing Traffic', key: 'calcOutTraffic', width: 20 },
    { header: 'Calc Incoming Traffic', key: 'calcIncTraffic', width: 20 },
    { header: 'Incoming Revenue ($)', key: 'incRev', width: 20 },
    { header: 'Subscriber Revenue ($)', key: 'subRev', width: 20 },
    { header: 'Total Revenue ($)', key: 'totalRev', width: 20 },
    { header: 'Wholesale Cost ($)', key: 'wholesaleCost', width: 20 },
    { header: 'Total Cost ($)', key: 'totalCost', width: 20 },
    { header: 'Gross Profit ($)', key: 'grossProfit', width: 20 },
    { header: 'Net Profit ($)', key: 'netProfit', width: 20 },
    { header: 'Margin %', key: 'marginPct', width: 14 }
  ];

  // Header Styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };

  records.forEach((item) => {
    const raw = item.rawRow;
    const calc = item.calculations;

    sheet.addRow({
      date: raw.date,
      customer: raw.customer_name,
      operator: raw.operator_name,
      carrier: raw.carrier_name,
      route: raw.route_code,
      country: raw.dest_country,
      rawOutMins: raw.outgoing_mins,
      rawIncMins: raw.incoming_mins,
      calcOutTraffic: calc.calculatedOutgoingTraffic,
      calcIncTraffic: calc.calculatedIncomingTraffic,
      incRev: calc.incomingRevenue,
      subRev: calc.subscriberRevenue,
      totalRev: calc.totalRevenue,
      wholesaleCost: calc.wholesaleCost,
      totalCost: calc.totalCost,
      grossProfit: calc.grossProfit,
      netProfit: calc.netProfit,
      marginPct: `${calc.profitMarginPct}%`
    });
  });

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export function generateExportCsv(records: any[]): string {
  const headers = [
    'Date', 'Customer', 'Operator', 'Carrier', 'Route', 'Country',
    'Raw_Outgoing_Mins', 'Raw_Incoming_Mins', 'Calc_Outgoing_Traffic', 'Calc_Incoming_Traffic',
    'Incoming_Revenue', 'Subscriber_Revenue', 'Total_Revenue', 'Wholesale_Cost', 'Total_Cost',
    'Gross_Profit', 'Net_Profit', 'Margin_Pct'
  ];

  let csv = headers.join(',') + '\n';

  records.forEach((item) => {
    const raw = item.rawRow;
    const calc = item.calculations;

    const row = [
      raw.date,
      `"${raw.customer_name}"`,
      `"${raw.operator_name}"`,
      `"${raw.carrier_name}"`,
      `"${raw.route_code}"`,
      `"${raw.dest_country}"`,
      raw.outgoing_mins,
      raw.incoming_mins,
      calc.calculatedOutgoingTraffic,
      calc.calculatedIncomingTraffic,
      calc.incomingRevenue,
      calc.subscriberRevenue,
      calc.totalRevenue,
      calc.wholesaleCost,
      calc.totalCost,
      calc.grossProfit,
      calc.netProfit,
      calc.profitMarginPct
    ];

    csv += row.join(',') + '\n';
  });

  return csv;
}
