export interface ValidationErrorItem {
  rowNumber: number;
  column: string;
  value: any;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningCount: number;
  duplicateCount: number;
  errors: ValidationErrorItem[];
}

export const REQUIRED_HEADER_COLUMNS = [
  'date',
  'customer_id',
  'customer_name',
  'operator_code',
  'operator_name',
  'carrier_code',
  'carrier_name',
  'source_country',
  'dest_country',
  'route_code'
];

/**
 * Validates header row against required schema
 */
export function validateHeaderColumns(headers: string[]): { valid: boolean; missingColumns: string[] } {
  const normalizedHeaders = headers.map(h => String(h || '').trim().toLowerCase().replace(/ /g, '_'));
  
  const missing = REQUIRED_HEADER_COLUMNS.filter(col => {
    // Flexible matching for dest_country / destination_country, etc.
    if (col === 'dest_country') {
      return !normalizedHeaders.includes('dest_country') && !normalizedHeaders.includes('destination_country');
    }
    return !normalizedHeaders.includes(col);
  });

  return {
    valid: missing.length === 0,
    missingColumns: missing
  };
}

/**
 * Detailed row-by-row commercial record validator
 */
export function validateCommercialRow(
  row: any,
  rowNumber: number,
  seenDuplicateKeys: Set<string>
): { valid: boolean; isDuplicate: boolean; errors: ValidationErrorItem[]; sanitizedData?: any } {
  const errors: ValidationErrorItem[] = [];

  // Required Field Non-Empty Checks
  if (!row.customer_id || String(row.customer_id).trim() === '') {
    errors.push({ rowNumber, column: 'Customer_ID', value: row.customer_id, message: 'Missing required field: Customer ID', severity: 'ERROR' });
  }
  if (!row.operator_code || String(row.operator_code).trim() === '') {
    errors.push({ rowNumber, column: 'Operator_Code', value: row.operator_code, message: 'Missing required field: Operator Code', severity: 'ERROR' });
  }
  if (!row.carrier_code || String(row.carrier_code).trim() === '') {
    errors.push({ rowNumber, column: 'Carrier_Code', value: row.carrier_code, message: 'Missing required field: Carrier Code', severity: 'ERROR' });
  }
  if (!row.route_code || String(row.route_code).trim() === '') {
    errors.push({ rowNumber, column: 'Route_Code', value: row.route_code, message: 'Missing required field: Route Code', severity: 'ERROR' });
  }

  // Date Parsing & Validation
  let parsedDate: Date | null = null;
  if (!row.date) {
    errors.push({ rowNumber, column: 'Date', value: row.date, message: 'Missing required date value', severity: 'ERROR' });
  } else {
    const d = new Date(row.date);
    if (isNaN(d.getTime())) {
      errors.push({ rowNumber, column: 'Date', value: row.date, message: `Invalid date format: "${row.date}". Expected YYYY-MM-DD`, severity: 'ERROR' });
    } else {
      parsedDate = d;
    }
  }

  // Traffic Minutes Validation (Must be non-negative numbers)
  const outgoingMins = Number(row.outgoing_mins);
  if (isNaN(outgoingMins)) {
    errors.push({ rowNumber, column: 'Outgoing_Minutes', value: row.outgoing_mins, message: 'Outgoing minutes must be a valid number', severity: 'ERROR' });
  } else if (outgoingMins < 0) {
    errors.push({ rowNumber, column: 'Outgoing_Minutes', value: row.outgoing_mins, message: `Negative traffic volume detected (${outgoingMins} mins)`, severity: 'ERROR' });
  }

  const incomingMins = Number(row.incoming_mins);
  if (isNaN(incomingMins)) {
    errors.push({ rowNumber, column: 'Incoming_Minutes', value: row.incoming_mins, message: 'Incoming minutes must be a valid number', severity: 'ERROR' });
  } else if (incomingMins < 0) {
    errors.push({ rowNumber, column: 'Incoming_Minutes', value: row.incoming_mins, message: `Negative traffic volume detected (${incomingMins} mins)`, severity: 'ERROR' });
  }

  // Percentage & Share Validation
  const outgoingShare = Number(row.outgoing_share);
  if (isNaN(outgoingShare)) {
    errors.push({ rowNumber, column: 'Outgoing_Share', value: row.outgoing_share, message: 'Outgoing share must be a valid number', severity: 'ERROR' });
  } else if (outgoingShare < 0) {
    errors.push({ rowNumber, column: 'Outgoing_Share', value: row.outgoing_share, message: 'Percentage cannot be negative', severity: 'ERROR' });
  } else if (outgoingShare > 1 && outgoingShare > 100) {
    errors.push({ rowNumber, column: 'Outgoing_Share', value: row.outgoing_share, message: `Unusually high outgoing share (${outgoingShare}% > 100%)`, severity: 'WARNING' });
  }

  const incomingShare = Number(row.incoming_share);
  if (isNaN(incomingShare)) {
    errors.push({ rowNumber, column: 'Incoming_Share', value: row.incoming_share, message: 'Incoming share must be a valid number', severity: 'ERROR' });
  } else if (incomingShare < 0) {
    errors.push({ rowNumber, column: 'Incoming_Share', value: row.incoming_share, message: 'Percentage cannot be negative', severity: 'ERROR' });
  } else if (incomingShare > 1 && incomingShare > 100) {
    errors.push({ rowNumber, column: 'Incoming_Share', value: row.incoming_share, message: `Unusually high incoming share (${incomingShare}% > 100%)`, severity: 'WARNING' });
  }

  // Rate Validation
  const incRevRate = Number(row.inc_rev_rate);
  if (isNaN(incRevRate) || incRevRate < 0) {
    errors.push({ rowNumber, column: 'Incoming_Revenue_Rate', value: row.inc_rev_rate, message: 'Incoming revenue rate must be non-negative number', severity: 'ERROR' });
  }

  const outCostRate = Number(row.out_cost_rate);
  if (isNaN(outCostRate) || outCostRate < 0) {
    errors.push({ rowNumber, column: 'Outgoing_Cost_Rate', value: row.out_cost_rate, message: 'Outgoing cost rate must be non-negative number', severity: 'ERROR' });
  }

  const outRevRate = Number(row.out_rev_rate);
  if (isNaN(outRevRate) || outRevRate < 0) {
    errors.push({ rowNumber, column: 'Outgoing_Revenue_Per_Min', value: row.out_rev_rate, message: 'Outgoing subscriber rate must be non-negative number', severity: 'ERROR' });
  }

  // Duplicate Check Key
  const dateStr = parsedDate ? parsedDate.toISOString().split('T')[0] : String(row.date);
  const dupKey = `${dateStr}|${row.customer_id}|${row.operator_code}|${row.carrier_code}|${row.route_code}|${row.direction || 'BOTH'}`;
  let isDuplicate = false;

  if (seenDuplicateKeys.has(dupKey)) {
    isDuplicate = true;
    errors.push({
      rowNumber,
      column: 'Record_Key',
      value: dupKey,
      message: `Duplicate record detected for key: ${dupKey}`,
      severity: 'WARNING'
    });
  } else {
    seenDuplicateKeys.add(dupKey);
  }

  const hasFatalErrors = errors.some(e => e.severity === 'ERROR');

  return {
    valid: !hasFatalErrors,
    isDuplicate,
    errors,
    sanitizedData: !hasFatalErrors ? {
      date: dateStr,
      customer_id: String(row.customer_id).trim(),
      customer_name: String(row.customer_name || 'Default Customer').trim(),
      operator_code: String(row.operator_code).trim(),
      operator_name: String(row.operator_name || 'Default Operator').trim(),
      carrier_code: String(row.carrier_code).trim(),
      carrier_name: String(row.carrier_name || 'Default Carrier').trim(),
      source_country: String(row.source_country || 'India').trim(),
      dest_country: String(row.dest_country || row.destination_country || 'Global').trim(),
      region: String(row.region || 'Global').trim(),
      route_code: String(row.route_code).trim(),
      cable: row.cable || row.submarine_cable || null,
      direction: String(row.direction || row.traffic_direction || 'BOTH').toUpperCase(),
      outgoing_mins: outgoingMins,
      incoming_mins: incomingMins,
      outgoing_share: outgoingShare,
      incoming_share: incomingShare,
      inc_rev_rate: incRevRate,
      out_cost_rate: outCostRate,
      out_rev_rate: outRevRate,
      interconnect_rate: Number(row.interconnect_rate || 0),
      cable_cost: Number(row.cable_cost || row.cable_capacity_cost || 0),
      currency: String(row.currency || 'INR').trim()
    } : undefined
  };
}
