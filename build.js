const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const srcDir = 'src';
const outputJS = 'app.js';
const outputHTML = 'index.html';

const jsPath = path.join(srcDir, 'app.js');
const htmlPath = path.join(srcDir, 'index.html');

if (!fs.existsSync(jsPath) || !fs.existsSync(htmlPath)) {
  console.error('❌ Required files not found in ./src (expected: app.js, index.html)');
  process.exit(1);
}

// --- Obfuscate JS ---
const inputCode = fs.readFileSync(jsPath, 'utf8');
console.log('🔐 Obfuscating app.js...');
const obfuscationResult = JavaScriptObfuscator.obfuscate(inputCode, {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: true,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75
});
fs.writeFileSync(outputJS, obfuscationResult.getObfuscatedCode());

// --- Minify HTML ---
console.log('🔧 Minifying index.html...');
execSync(`npx html-minifier-terser ${htmlPath} -o ${outputHTML} --collapse-whitespace --remove-comments`, { stdio: 'inherit' });

console.log(`✅ Build complete:
- ${outputJS}
- ${outputHTML}`);
