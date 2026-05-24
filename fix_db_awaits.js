const fs = require('fs');
const path = require('path');

const routersDir = path.join(__dirname, 'server', 'routers');

fs.readdirSync(routersDir).forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(routersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace "const db = getDb();" with "const db = await getDb();"
    if (content.includes('const db = getDb();')) {
      content = content.replace(/const db = getDb\(\);/g, 'const db = await getDb();');
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    }
  }
});

console.log('Done!');
