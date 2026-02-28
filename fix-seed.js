const fs = require('fs');
let s = fs.readFileSync('seed.js', 'utf8');
s = s.replace(/salary: , address: 'Test Address'/g, "salary: 30000, address: 'Test Address'");
fs.writeFileSync('seed.js', s);
