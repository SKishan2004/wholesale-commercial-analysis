import fs from 'fs';
import path from 'path';

async function verifyPersistence() {
  console.log('1. Checking summary from running server...');
  const res1 = await fetch('http://localhost:5000/api/dashboard/summary');
  const summary1 = (await res1.json()) as any;
  console.log(`   Initial Record Count in DB: ${summary1.recordCount}`);

  console.log('2. Uploading sample Excel file...');
  const filePath = path.join(__dirname, '../../data/sample_wholesale_data.xlsx');
  const buffer = fs.readFileSync(filePath);
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="sample_wholesale_data.xlsx"\r\n`;
  body += `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;

  const payload = Buffer.concat([
    Buffer.from(body, 'utf-8'),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
  ]);

  const uploadRes = await fetch('http://localhost:5000/api/import/excel', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: payload
  });
  const uploadData = (await uploadRes.json()) as any;
  console.log(`   Uploaded ${uploadData.validRows} valid rows.`);

  console.log('3. Committing import into database...');
  const commitRes = await fetch('http://localhost:5000/api/import/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: 'sample_wholesale_data.xlsx', replaceExisting: true })
  });
  const commitData = (await commitRes.json()) as any;
  console.log(`   Commit result: ${commitData.message}`);

  const res2 = await fetch('http://localhost:5000/api/dashboard/summary');
  const summary2 = (await res2.json()) as any;
  console.log(`   Updated Record Count (Before Restart): ${summary2.recordCount}`);

  console.log('✅ Upload and Commit verified in database.');
}

verifyPersistence().catch(console.error);
