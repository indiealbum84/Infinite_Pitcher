const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'www');

const copyRecursive = (src, dest) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      if (entry === '.DS_Store') continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
};

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const items = ['index.html', 'game-art.css', 'manifest.json', 'privacy.html', 'images', 'sounds'];
for (const item of items) {
  const src = path.join(root, item);
  if (fs.existsSync(src)) {
    copyRecursive(src, path.join(outDir, item));
  }
}

console.log('Prepared www/ with runtime assets.');
