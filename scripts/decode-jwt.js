const https = require('https');

https.get('https://stagingapi.gujjutours.com/api/core/v1/config/www.gujjutours.com?lang=en', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    const token = json?.result?.website?.serviceAuthToken;
    console.log('JWT Token found!');
    const parts = token.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('JWT Header:', header);
    console.log('JWT Payload:', JSON.stringify(payload, null, 2));
  });
});

