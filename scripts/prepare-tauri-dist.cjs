const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'dist-tauri');

const entries = [
  'index.html',
  'game.js',
  'config',
  'domain',
  'entities',
  'resources',
  'scenes',
  'utils',
  'vendor'
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const src = path.join(root, entry);
  const dst = path.join(outDir, entry);
  fs.cpSync(src, dst, { recursive: true });
}

console.log('prepare-tauri-dist: dist-tauri updated');
