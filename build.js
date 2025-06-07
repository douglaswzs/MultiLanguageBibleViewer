const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcDir = 'src';
const outputJS = 'app.js';
const outputHTML = 'index.html';

const jsPath = path.join(srcDir, 'app.js');
const htmlPath = path.join(srcDir, 'index.html');

if (!fs.existsSync(jsPath) || !fs.existsSync(htmlPath)) {
  console.error('❌ Required files not found in ./src (expected: app.js, index.html)');
  process.exit(1);
}

console.log('🔧 Minifying app.js...');
execSync(`npx terser ${jsPath} -o ${outputJS} -c -m`, { stdio: 'inherit' });

console.log('🔧 Minifying index.html...');
execSync(`npx html-minifier-terser ${htmlPath} -o ${outputHTML} --collapse-whitespace --remove-comments`, { stdio: 'inherit' });

console.log(`✅ Build complete:
- ${outputJS}
- ${outputHTML}`);
