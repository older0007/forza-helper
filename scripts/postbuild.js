const fs = require('fs-extra');
const path = require('path');

async function main() {
  const src = path.join(__dirname, '..', 'node_modules', 'node-hid', 'prebuilds');
  const dest = path.join(__dirname, '..', 'dist', 'prebuilds');
  
  try {
    await fs.ensureDir(dest);
    await fs.copy(src, dest);
    console.log('[Post-Build] Copied node-hid prebuilds to dist/prebuilds successfully.');
  } catch (err) {
    console.error('[Post-Build] Failed to copy node-hid prebuilds:', err);
    process.exit(1);
  }
}

main();
