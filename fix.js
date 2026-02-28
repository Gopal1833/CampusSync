const fs = require('fs');
let s = fs.readFileSync('server.js', 'utf8');
s = s.replace(/app\.listen\(PORT, \(\) => {[\s\S]*?}\);/, "app.listen(PORT, () => {\n    console.log(`Vidya HMS Server Running on port ${PORT}`);\n});");
fs.writeFileSync('server.js', s);
