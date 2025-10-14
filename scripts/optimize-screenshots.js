const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..', 'assets', 'screenshots');

async function optimizeFile(file) {
  const full = path.join(dir, file);
  const out = full; // overwrite

  try {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.png') {
      // Convert to optimized PNG
      await sharp(full)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(out + '.tmp');
    } else {
      // For other formats, convert to optimized PNG
      await sharp(full)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(out + '.tmp');
    }

    await fs.promises.rename(out + '.tmp', out);
    console.log('Optimized', file);
  } catch (err) {
    console.error('Failed to optimize', file, err.message);
  }
}

async function main() {
  if (!fs.existsSync(dir)) {
    console.error('Screenshots directory not found:', dir);
    process.exit(1);
  }

  const files = await fs.promises.readdir(dir);
  for (const f of files) {
    if (/\.(png|jpg|jpeg)$/i.test(f)) {
      await optimizeFile(f);
    }
  }
}

main();
