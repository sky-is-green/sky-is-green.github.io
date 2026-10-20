const fs = require('fs');
const P = require(process.argv[2]);
const raw = fs.readFileSync(process.argv[3]);
const meta = JSON.parse(fs.readFileSync(process.argv[3] + '.meta', 'utf8'));
const data = new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.length);
console.log('decoded:', JSON.stringify(P.decodeRGBA({ data, width: meta.w, height: meta.h })));
