import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

export interface MnoOperator {
  operatorName: string;
  subBase: string;
  marketShare: string;
  subscriberGrowth: string;
  prepPost: string;
  arpuGrowth: string;
  fiveGPenetration: string;
  revenueGrowth: string;
  profitability: string;
  capex: string;
}

export interface MnoCountry {
  country: string;
  region: string;
  subRegion: string;
  formerlyKnownAs: string;
  population: string;
  mobileUsers: string;
  mobilePenetration: string;
  gdpGrowth: string;
  avgAge: string;
  internetUsers: string;
  gdpPerCapita: string;
  outboundRoamingTrend: string;
  inboundRoamingTrend: string;
  businessTravellers: string;
  topRoamingCountries: string[];
  ottCalls: string;
  roamingComments: string;
  operators: MnoOperator[];
}

export interface MnoRoute {
  id: string;
  sourceCountry: string;
  sourceRegion: string;
  sourceOperators: MnoOperator[];
  destinationCountry: string;
  destinationRegion: string;
  destinationOperators: MnoOperator[];
  outboundRoamingTrend: string;
  roamingComments: string;
}

let cachedCountries: MnoCountry[] | null = null;
let cachedRoutes: MnoRoute[] | null = null;

function findExcelFilePath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), '../Global_Telecom_MNO_Verified.xlsx'),
    path.resolve(process.cwd(), 'Global_Telecom_MNO_Verified.xlsx'),
    path.resolve(__dirname, '../../../Global_Telecom_MNO_Verified.xlsx'),
    path.resolve(__dirname, '../../Global_Telecom_MNO_Verified.xlsx')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(`Global_Telecom_MNO_Verified.xlsx not found in paths: ${possiblePaths.join(', ')}`);
}

export async function parseMnoExcel(): Promise<MnoCountry[]> {
  if (cachedCountries) {
    return cachedCountries;
  }

  const filePath = findExcelFilePath();
  console.log(`📊 Parsing MNO Excel Data from: ${filePath}`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);

  const sheet = wb.getWorksheet('Combined MNO Data');
  if (!sheet) {
    throw new Error('Sheet "Combined MNO Data" not found in Excel file');
  }

  const countryMap = new Map<string, MnoCountry>();

  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 2) return;

    const region = row.getCell(1).text?.trim() || '';
    const subRegion = row.getCell(2).text?.trim() || '';
    const country = row.getCell(3).text?.trim() || '';
    const formerlyKnownAs = row.getCell(4).text?.trim() || '';
    const population = row.getCell(5).text?.trim() || '';
    const mobileUsers = row.getCell(6).text?.trim() || '';
    const mobilePenetration = row.getCell(7).text?.trim() || '';
    const gdpGrowth = row.getCell(8).text?.trim() || '';
    const avgAge = row.getCell(9).text?.trim() || '';
    const ageOver65 = row.getCell(10).text?.trim() || '';
    const internetUsers = row.getCell(11).text?.trim() || '';
    const gdpPerCapita = row.getCell(12).text?.trim() || '';

    const operatorName = row.getCell(13).text?.trim() || '';
    const subBase = row.getCell(14).text?.trim() || '';
    const marketShare = row.getCell(15).text?.trim() || '';
    const subscriberGrowth = row.getCell(16).text?.trim() || '';
    const prepPost = row.getCell(17).text?.trim() || '';
    const arpuGrowth = row.getCell(18).text?.trim() || '';
    const fiveGPenetration = row.getCell(19).text?.trim() || '';
    const revenueGrowth = row.getCell(20).text?.trim() || '';
    const profitability = row.getCell(21).text?.trim() || '';
    const capex = row.getCell(22).text?.trim() || '';

    const outboundRoamingTrend = row.getCell(24).text?.trim() || '';
    const inboundRoamingTrend = row.getCell(25).text?.trim() || '';
    const businessTravellers = row.getCell(26).text?.trim() || '';
    const topRoamingCountriesRaw = row.getCell(27).text?.trim() || '';
    const ottCalls = row.getCell(28).text?.trim() || '';
    const roamingComments = row.getCell(29).text?.trim() || '';

    if (!country || country === 'N/A' || country === 'Country') return;

    if (!countryMap.has(country)) {
      const topRoaming = topRoamingCountriesRaw
        ? topRoamingCountriesRaw.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      countryMap.set(country, {
        country,
        region,
        subRegion,
        formerlyKnownAs,
        population,
        mobileUsers,
        mobilePenetration,
        gdpGrowth,
        avgAge,
        internetUsers,
        gdpPerCapita,
        outboundRoamingTrend,
        inboundRoamingTrend,
        businessTravellers,
        topRoamingCountries: topRoaming,
        ottCalls,
        roamingComments,
        operators: []
      });
    }

    if (operatorName && operatorName !== 'Operator Name') {
      countryMap.get(country)!.operators.push({
        operatorName,
        subBase,
        marketShare,
        subscriberGrowth,
        prepPost,
        arpuGrowth,
        fiveGPenetration,
        revenueGrowth,
        profitability,
        capex
      });
    }
  });

  cachedCountries = Array.from(countryMap.values());
  console.log(`✅ Loaded ${cachedCountries.length} countries and ${cachedCountries.reduce((sum, c) => sum + c.operators.length, 0)} operators.`);
  return cachedCountries;
}

export async function getMnoRoutes(): Promise<MnoRoute[]> {
  if (cachedRoutes) {
    return cachedRoutes;
  }

  const countries = await parseMnoExcel();
  const countryNameMap = new Map<string, MnoCountry>();
  countries.forEach(c => countryNameMap.set(c.country.toLowerCase(), c));

  const routes: MnoRoute[] = [];
  let routeCounter = 1;

  for (const src of countries) {
    for (const destName of src.topRoamingCountries) {
      // Find matching destination country
      const matchedDestKey = Array.from(countryNameMap.keys()).find(k =>
        k === destName.toLowerCase() ||
        k.includes(destName.toLowerCase()) ||
        destName.toLowerCase().includes(k)
      );

      const destCountryObj = matchedDestKey ? countryNameMap.get(matchedDestKey) : null;

      routes.push({
        id: `route-${routeCounter++}`,
        sourceCountry: src.country,
        sourceRegion: src.region || src.subRegion,
        sourceOperators: src.operators,
        destinationCountry: destCountryObj ? destCountryObj.country : destName,
        destinationRegion: destCountryObj ? (destCountryObj.region || destCountryObj.subRegion) : 'International',
        destinationOperators: destCountryObj ? destCountryObj.operators : [],
        outboundRoamingTrend: src.outboundRoamingTrend,
        roamingComments: src.roamingComments
      });
    }
  }

  cachedRoutes = routes;
  console.log(`✅ Built ${routes.length} carrier routes.`);
  return cachedRoutes;
}
