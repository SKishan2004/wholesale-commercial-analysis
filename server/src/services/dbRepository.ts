import { prisma } from '../db/prismaClient';
import path from 'path';
import fs from 'fs';
import { calculateCommercialPerformance } from '../calculation/calculationEngine';
import { parseAndValidateExcel } from './excelParser';

// Configurable Server Storage Directory for Permanent Original Excel File Retention
export const STORAGE_UPLOADS_DIR = path.join(__dirname, '../../storage/uploads');

if (!fs.existsSync(STORAGE_UPLOADS_DIR)) {
  fs.mkdirSync(STORAGE_UPLOADS_DIR, { recursive: true });
}

export interface CommitImportParams {
  originalFilename: string;
  tempFilePath: string;
  fileSize: number;
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  warningCount: number;
  replaceExisting: boolean;
  validRecords: any[];
}

/**
 * Executes atomic database transaction for Excel import and permanent file retention
 */
export async function commitImportToDatabase(params: CommitImportParams) {
  const {
    originalFilename,
    tempFilePath,
    fileSize,
    totalRows,
    validRows,
    rejectedRows,
    warningCount,
    replaceExisting,
    validRecords
  } = params;

  // 1. Move uploaded file to safe permanent storage directory with server-generated safe filename
  const safeFilename = `import_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.xlsx`;
  const storedFilePath = path.join(STORAGE_UPLOADS_DIR, safeFilename);

  if (fs.existsSync(tempFilePath)) {
    fs.copyFileSync(tempFilePath, storedFilePath);
  }

  // 2. Atomic Prisma Transaction
  return await prisma.$transaction(async (tx) => {
    // If replaceExisting is true, delete existing commercial records atomically
    if (replaceExisting) {
      await tx.trafficCommercialRecord.deleteMany({});
    }

    // Create ImportJob metadata record
    const importJob = await tx.importJob.create({
      data: {
        originalFilename,
        storedFilePath: safeFilename,
        uploadedAt: new Date(),
        fileSize,
        totalRows,
        validRows,
        rejectedRows,
        warningCount,
        status: 'COMMITTED',
        replaceExisting
      }
    });

    // Dimension maps to prevent duplicate queries
    const customerMap = new Map<string, string>();
    const operatorMap = new Map<string, string>();
    const carrierMap = new Map<string, string>();
    const countryMap = new Map<string, string>();
    const routeMap = new Map<string, string>();

    // Batch process dimension upserts & create fact records
    const recordCreateInputs = [];

    for (const record of validRecords) {
      const raw = record.rawRow;
      const calc = record.calculations;

      // Upsert Customer
      if (!customerMap.has(raw.customer_id)) {
        const cust = await tx.customer.upsert({
          where: { code: raw.customer_id },
          update: { name: raw.customer_name },
          create: { code: raw.customer_id, name: raw.customer_name }
        });
        customerMap.set(raw.customer_id, cust.id);
      }

      // Upsert Operator
      if (!operatorMap.has(raw.operator_code)) {
        const op = await tx.operator.upsert({
          where: { code: raw.operator_code },
          update: { name: raw.operator_name },
          create: { code: raw.operator_code, name: raw.operator_name }
        });
        operatorMap.set(raw.operator_code, op.id);
      }

      // Upsert Carrier
      if (!carrierMap.has(raw.carrier_code)) {
        const carr = await tx.carrier.upsert({
          where: { code: raw.carrier_code },
          update: { name: raw.carrier_name },
          create: { code: raw.carrier_code, name: raw.carrier_name }
        });
        carrierMap.set(raw.carrier_code, carr.id);
      }

      // Upsert Country
      if (!countryMap.has(raw.dest_country)) {
        const cntry = await tx.country.upsert({
          where: { code: raw.dest_country },
          update: { name: raw.dest_country, region: raw.region || 'Global' },
          create: { code: raw.dest_country, name: raw.dest_country, region: raw.region || 'Global' }
        });
        countryMap.set(raw.dest_country, cntry.id);
      }

      // Upsert Route
      if (!routeMap.has(raw.route_code)) {
        const rt = await tx.route.upsert({
          where: { code: raw.route_code },
          update: { name: raw.route_code, cableName: raw.cable || null, sourceCode: raw.source_country, destCode: raw.dest_country },
          create: { code: raw.route_code, name: raw.route_code, cableName: raw.cable || null, sourceCode: raw.source_country, destCode: raw.dest_country }
        });
        routeMap.set(raw.route_code, rt.id);
      }

      const recDate = new Date(raw.date);

      recordCreateInputs.push({
        recordDate: recDate,
        month: recDate.getMonth() + 1,
        year: recDate.getFullYear(),
        importId: importJob.id,
        customerId: customerMap.get(raw.customer_id)!,
        operatorId: operatorMap.get(raw.operator_code)!,
        carrierId: carrierMap.get(raw.carrier_code)!,
        countryId: countryMap.get(raw.dest_country)!,
        routeId: routeMap.get(raw.route_code)!,
        trafficDirection: raw.direction || 'BOTH',
        outgoingMinutes: raw.outgoing_mins,
        incomingMinutes: raw.incoming_mins,
        outgoingShare: raw.outgoing_share,
        incomingShare: raw.incoming_share,
        calculatedOutgoingTraffic: calc.calculatedOutgoingTraffic,
        calculatedIncomingTraffic: calc.calculatedIncomingTraffic,
        incomingRevenueRate: raw.inc_rev_rate,
        outgoingRevenueRate: raw.out_rev_rate,
        outgoingCostRate: raw.out_cost_rate,
        interconnectCostRate: raw.interconnect_rate || 0,
        cableCapacityCost: raw.cable_cost || 0,
        incomingRevenue: calc.incomingRevenue,
        subscriberRevenue: calc.subscriberRevenue,
        totalRevenue: calc.totalRevenue,
        wholesaleCost: calc.wholesaleCost,
        totalVariableCost: calc.totalVariableCost,
        totalFixedCost: calc.totalFixedCost,
        totalCost: calc.totalCost,
        grossProfit: calc.grossProfit,
        netProfit: calc.netProfit,
        profitMarginPct: calc.profitMarginPct,
        currency: raw.currency || 'USD'
      });
    }

    // Insert fact records in chunks
    const chunkSize = 100;
    for (let i = 0; i < recordCreateInputs.length; i += chunkSize) {
      const chunk = recordCreateInputs.slice(i, i + chunkSize);
      await tx.trafficCommercialRecord.createMany({ data: chunk });
    }

    return importJob;
  });
}

/**
 * Seeds initial database from sample Excel file if database is empty on server startup
 */
export async function seedDatabaseIfEmpty() {
  const existingCount = await prisma.trafficCommercialRecord.count();
  if (existingCount > 0) {
    console.log(`✅ Database already contains ${existingCount} commercial records. Persistence active.`);
    return;
  }

  const possiblePaths = [
    path.join(process.cwd(), 'data/sample_wholesale_data.xlsx'),
    path.join(__dirname, '../data/sample_wholesale_data.xlsx'),
    path.join(__dirname, '../../data/sample_wholesale_data.xlsx')
  ];

  let sampleExcelPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sampleExcelPath = p;
      break;
    }
  }

  if (sampleExcelPath) {
    console.log(`🔄 Seeding empty database with sample Excel file: ${sampleExcelPath}...`);
    const parsed = await parseAndValidateExcel(sampleExcelPath);
    await commitImportToDatabase({
      originalFilename: 'sample_wholesale_data.xlsx',
      tempFilePath: sampleExcelPath,
      fileSize: fs.statSync(sampleExcelPath).size,
      totalRows: parsed.records.length,
      validRows: parsed.records.length,
      rejectedRows: 0,
      warningCount: 0,
      replaceExisting: false,
      validRecords: parsed.records
    });
    console.log(`✅ Seeded ${parsed.records.length} records into PostgreSQL database.`);
  }
}

/**
 * Filter clause builder for Prisma database queries
 */
function buildPrismaWhereClause(query: any) {
  const { startDate, endDate, operator, carrier, customer, route, country, direction } = query;
  const where: any = {};

  if (startDate || endDate) {
    where.recordDate = {};
    if (startDate) where.recordDate.gte = new Date(String(startDate));
    if (endDate) where.recordDate.lte = new Date(String(endDate));
  }

  if (operator) {
    where.operator = {
      OR: [
        { code: String(operator) },
        { name: String(operator) }
      ]
    };
  }

  if (carrier) {
    where.carrier = {
      OR: [
        { code: String(carrier) },
        { name: String(carrier) }
      ]
    };
  }

  if (customer) {
    where.customer = {
      OR: [
        { code: String(customer) },
        { name: String(customer) }
      ]
    };
  }

  if (route) {
    where.route = { code: String(route) };
  }

  if (country) {
    where.country = {
      OR: [
        { code: String(country) },
        { name: String(country) }
      ]
    };
  }

  if (direction) {
    where.trafficDirection = String(direction);
  }

  return where;
}

// -----------------------------------------------------------------
// PERSISTENT DATABASE QUERY API HELPERS
// -----------------------------------------------------------------

export async function getDbFilterOptions() {
  const [operators, carriers, customers, countries, routes] = await Promise.all([
    prisma.operator.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.carrier.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.customer.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.country.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    prisma.route.findMany({ select: { code: true }, orderBy: { code: 'asc' } })
  ]);

  return {
    operators: operators.map(o => o.name),
    carriers: carriers.map(c => c.name),
    customers: customers.map(c => c.name),
    countries: countries.map(c => c.name),
    routes: routes.map(r => r.code)
  };
}

export async function getDbDashboardSummary(query: any) {
  const where = buildPrismaWhereClause(query);
  const records = await prisma.trafficCommercialRecord.findMany({ where });

  let totalOutgoingMins = 0;
  let totalIncomingMins = 0;
  let totalCalcOutgoingMins = 0;
  let totalCalcIncomingMins = 0;
  let totalIncomingRev = 0;
  let totalSubscriberRev = 0;
  let totalRevenue = 0;
  let wholesaleCost = 0;
  let totalCost = 0;
  let netProfit = 0;

  records.forEach((r) => {
    totalOutgoingMins += r.outgoingMinutes;
    totalIncomingMins += r.incomingMinutes;
    totalCalcOutgoingMins += r.calculatedOutgoingTraffic;
    totalCalcIncomingMins += r.calculatedIncomingTraffic;

    totalIncomingRev += r.incomingRevenue;
    totalSubscriberRev += r.subscriberRevenue;
    totalRevenue += r.totalRevenue;
    wholesaleCost += r.wholesaleCost;
    totalCost += r.totalCost;
    netProfit += r.netProfit;
  });

  const grossProfit = totalRevenue - wholesaleCost;
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const avgRevPerMin = totalCalcOutgoingMins > 0 ? totalRevenue / totalCalcOutgoingMins : 0;
  const avgCostPerMin = totalCalcOutgoingMins > 0 ? totalCost / totalCalcOutgoingMins : 0;

  return {
    recordCount: records.length,
    totalOutgoingMins,
    totalIncomingMins,
    totalCalcOutgoingMins: Math.round(totalCalcOutgoingMins),
    totalCalcIncomingMins: Math.round(totalCalcIncomingMins),
    totalIncomingRev: Number(totalIncomingRev.toFixed(2)),
    totalSubscriberRev: Number(totalSubscriberRev.toFixed(2)),
    totalRevenue: Number(totalRevenue.toFixed(2)),
    wholesaleCost: Number(wholesaleCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    grossProfit: Number(grossProfit.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    marginPct: Number(marginPct.toFixed(2)),
    avgRevPerMin: Number(avgRevPerMin.toFixed(4)),
    avgCostPerMin: Number(avgCostPerMin.toFixed(4))
  };
}

export async function getDbDashboardTraffic(query: any) {
  const where = buildPrismaWhereClause(query);
  const records = await prisma.trafficCommercialRecord.findMany({
    where,
    include: { operator: true }
  });

  const byDateMap: { [date: string]: { incoming: number; outgoing: number } } = {};
  const byOperatorMap: { [op: string]: { incoming: number; outgoing: number } } = {};
  let globalOutgoingSum = 0;

  records.forEach((r) => {
    const dateStr = r.recordDate.toISOString().split('T')[0];
    const op = r.operator.name;

    globalOutgoingSum += r.calculatedOutgoingTraffic;

    if (!byDateMap[dateStr]) byDateMap[dateStr] = { incoming: 0, outgoing: 0 };
    byDateMap[dateStr].incoming += r.calculatedIncomingTraffic;
    byDateMap[dateStr].outgoing += r.calculatedOutgoingTraffic;

    if (!byOperatorMap[op]) byOperatorMap[op] = { incoming: 0, outgoing: 0 };
    byOperatorMap[op].incoming += r.calculatedIncomingTraffic;
    byOperatorMap[op].outgoing += r.calculatedOutgoingTraffic;
  });

  const trafficTrend = Object.keys(byDateMap).sort().map(d => ({
    date: d,
    incomingTraffic: Math.round(byDateMap[d].incoming),
    outgoingTraffic: Math.round(byDateMap[d].outgoing)
  }));

  const byOperator = Object.keys(byOperatorMap).map(op => ({
    operator: op,
    incomingTraffic: Math.round(byOperatorMap[op].incoming),
    outgoingTraffic: Math.round(byOperatorMap[op].outgoing)
  }));

  const operatorShare = Object.keys(byOperatorMap).map(op => ({
    operator: op,
    outgoingTraffic: Math.round(byOperatorMap[op].outgoing),
    sharePct: globalOutgoingSum > 0 ? Number(((byOperatorMap[op].outgoing / globalOutgoingSum) * 100).toFixed(2)) : 0
  }));

  return { trafficTrend, byOperator, operatorShare };
}

export async function getDbDashboardRevenueCost(query: any) {
  const where = buildPrismaWhereClause(query);
  const records = await prisma.trafficCommercialRecord.findMany({
    where,
    include: { operator: true }
  });

  const trendMap: { [date: string]: { revenue: number; cost: number; profit: number } } = {};
  const revByOpMap: { [op: string]: number } = {};
  const costByOpMap: { [op: string]: number } = {};

  let wholesaleSum = 0;
  let interconnectSum = 0;
  let cableCostSum = 0;

  records.forEach((r) => {
    const dateStr = r.recordDate.toISOString().split('T')[0];
    const op = r.operator.name;

    if (!trendMap[dateStr]) trendMap[dateStr] = { revenue: 0, cost: 0, profit: 0 };
    trendMap[dateStr].revenue += r.totalRevenue;
    trendMap[dateStr].cost += r.totalCost;
    trendMap[dateStr].profit += r.netProfit;

    revByOpMap[op] = (revByOpMap[op] || 0) + r.totalRevenue;
    costByOpMap[op] = (costByOpMap[op] || 0) + r.totalCost;

    wholesaleSum += r.wholesaleCost;
    interconnectSum += (r.totalVariableCost - r.wholesaleCost);
    cableCostSum += r.totalFixedCost;
  });

  const revenueVsCostTrend = Object.keys(trendMap).sort().map(d => ({
    date: d,
    revenue: Number(trendMap[d].revenue.toFixed(2)),
    cost: Number(trendMap[d].cost.toFixed(2)),
    profit: Number(trendMap[d].profit.toFixed(2))
  }));

  const revContributionByOperator = Object.keys(revByOpMap).map(op => ({
    operator: op,
    revenue: Number(revByOpMap[op].toFixed(2))
  }));

  const costContributionByOperator = Object.keys(costByOpMap).map(op => ({
    operator: op,
    cost: Number(costByOpMap[op].toFixed(2))
  }));

  const costCategoryBreakdown = [
    { category: 'Wholesale Base Cost', amount: Number(wholesaleSum.toFixed(2)) },
    { category: 'Interconnect & Transit', amount: Number(interconnectSum.toFixed(2)) },
    { category: 'Submarine Cable Capacity', amount: Number(cableCostSum.toFixed(2)) }
  ];

  return {
    revenueVsCostTrend,
    revContributionByOperator,
    costContributionByOperator,
    costCategoryBreakdown
  };
}

export async function getDbDashboardProfitability(query: any) {
  const where = buildPrismaWhereClause(query);
  const records = await prisma.trafficCommercialRecord.findMany({
    where,
    include: { operator: true, route: true }
  });

  const byOperatorMap: { [op: string]: { revenue: number; cost: number; profit: number } } = {};
  const byRouteMap: { [route: string]: { revenue: number; cost: number; profit: number } } = {};

  records.forEach((r) => {
    const op = r.operator.name;
    const route = r.route.code;

    if (!byOperatorMap[op]) byOperatorMap[op] = { revenue: 0, cost: 0, profit: 0 };
    byOperatorMap[op].revenue += r.totalRevenue;
    byOperatorMap[op].cost += r.totalCost;
    byOperatorMap[op].profit += r.netProfit;

    if (!byRouteMap[route]) byRouteMap[route] = { revenue: 0, cost: 0, profit: 0 };
    byRouteMap[route].revenue += r.totalRevenue;
    byRouteMap[route].cost += r.totalCost;
    byRouteMap[route].profit += r.netProfit;
  });

  const profitByOperator = Object.keys(byOperatorMap).map(op => ({
    operator: op,
    revenue: Number(byOperatorMap[op].revenue.toFixed(2)),
    cost: Number(byOperatorMap[op].cost.toFixed(2)),
    profit: Number(byOperatorMap[op].profit.toFixed(2)),
    marginPct: byOperatorMap[op].revenue > 0 ? Number(((byOperatorMap[op].profit / byOperatorMap[op].revenue) * 100).toFixed(2)) : 0
  }));

  const profitByRoute = Object.keys(byRouteMap).map(r => ({
    route: r,
    revenue: Number(byRouteMap[r].revenue.toFixed(2)),
    cost: Number(byRouteMap[r].cost.toFixed(2)),
    profit: Number(byRouteMap[r].profit.toFixed(2)),
    marginPct: byRouteMap[r].revenue > 0 ? Number(((byRouteMap[r].profit / byRouteMap[r].revenue) * 100).toFixed(2)) : 0
  }));

  return { profitByOperator, profitByRoute };
}

export async function getDbPaginatedRecords(query: any) {
  const where = buildPrismaWhereClause(query);
  const page = parseInt(String(query.page || 1));
  const limit = parseInt(String(query.limit || 10));

  const [total, records] = await Promise.all([
    prisma.trafficCommercialRecord.count({ where }),
    prisma.trafficCommercialRecord.findMany({
      where,
      include: {
        customer: true,
        operator: true,
        carrier: true,
        route: true,
        country: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { recordDate: 'desc' }
    })
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    records: records.map(r => ({
      date: r.recordDate.toISOString().split('T')[0],
      customer: r.customer.name,
      operator: r.operator.name,
      carrier: r.carrier.name,
      route: r.route.code,
      country: r.country.name,
      outgoingMins: r.outgoingMinutes,
      incomingMins: r.incomingMinutes,
      outgoingShare: r.outgoingShare,
      incomingShare: r.incomingShare,
      calcOutgoingTraffic: r.calculatedOutgoingTraffic,
      calcIncomingTraffic: r.calculatedIncomingTraffic,
      incRevRate: r.incomingRevenueRate,
      outCostRate: r.outgoingCostRate,
      outRevRate: r.outgoingRevenueRate,
      incomingRevenue: r.incomingRevenue,
      subscriberRevenue: r.subscriberRevenue,
      totalRevenue: r.totalRevenue,
      wholesaleCost: r.wholesaleCost,
      totalCost: r.totalCost,
      netProfit: r.netProfit,
      marginPct: r.profitMarginPct,
      importId: r.importId
    }))
  };
}

export async function getDbExportRecords(query: any) {
  const where = buildPrismaWhereClause(query);
  const records = await prisma.trafficCommercialRecord.findMany({
    where,
    include: {
      customer: true,
      operator: true,
      carrier: true,
      route: true,
      country: true
    },
    orderBy: { recordDate: 'asc' }
  });

  return records.map(r => ({
    rawRow: {
      date: r.recordDate.toISOString().split('T')[0],
      customer_name: r.customer.name,
      operator_name: r.operator.name,
      carrier_name: r.carrier.name,
      route_code: r.route.code,
      dest_country: r.country.name,
      outgoing_mins: r.outgoingMinutes,
      incoming_mins: r.incomingMinutes
    },
    calculations: {
      calculatedOutgoingTraffic: r.calculatedOutgoingTraffic,
      calculatedIncomingTraffic: r.calculatedIncomingTraffic,
      incomingRevenue: r.incomingRevenue,
      subscriberRevenue: r.subscriberRevenue,
      totalRevenue: r.totalRevenue,
      wholesaleCost: r.wholesaleCost,
      totalCost: r.totalCost,
      grossProfit: r.grossProfit,
      netProfit: r.netProfit,
      profitMarginPct: r.profitMarginPct
    }
  }));
}

export async function getDbImportHistory() {
  const history = await prisma.importJob.findMany({
    orderBy: { uploadedAt: 'desc' }
  });

  return history.map(h => ({
    id: h.id,
    fileName: h.originalFilename,
    storedFilePath: h.storedFilePath,
    uploadedAt: h.uploadedAt.toISOString(),
    totalRows: h.totalRows,
    importedRows: h.validRows,
    rejectedRows: h.rejectedRows,
    warningCount: h.warningCount,
    status: h.status
  }));
}
