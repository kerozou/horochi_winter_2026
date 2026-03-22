/**
 * node_modules の Phaser を vendor/ にコピー（静的ホスティング用）。
 * npm install 後に postinstall で実行される。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', 'phaser', 'dist', 'phaser.min.js');
const dst = path.join(root, 'vendor', 'phaser.min.js');

if (!fs.existsSync(src)) {
    console.warn('copy-phaser: node_modules/phaser not found; skip (run npm install).');
    process.exit(0);
}

fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log('copy-phaser: vendor/phaser.min.js updated');
