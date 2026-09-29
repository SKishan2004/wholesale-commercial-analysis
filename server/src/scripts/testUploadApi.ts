import fs from 'fs';
import path from 'path';

async function testUpload() {
  const filePath = path.join(__dirname, '../../data/sample_wholesale_data.xlsx');
  const buffer = fs.readFileSync(filePath);

  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="sample_wholesale_data.xlsx"\r\n`;
  body += `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`;

  const headerBuffer = Buffer.from(body, 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

  const payload = Buffer.concat([headerBuffer, buffer, footerBuffer]);

  const response = await fetch('http://localhost:5000/api/import/excel', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: payload
  });

  const data = await response.json();
  console.log('UPLOAD TEST RESPONSE:', JSON.stringify(data, null, 2));
}

testUpload().catch(console.error);
