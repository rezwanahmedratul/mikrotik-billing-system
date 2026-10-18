const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
  
  const svgPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;overflow:hidden;">${svgContent}</body></html>`);
  await page.waitForTimeout(100);

  const png64 = await page.screenshot({ type: 'png', omitBackground: true });
  
  // Also create a 32x32 view
  await page.setViewportSize({ width: 32, height: 32 });
  await page.waitForTimeout(100);
  const png32 = await page.screenshot({ type: 'png', omitBackground: true });

  await browser.close();

  // Write apple-touch-icon.png (64x64)
  const webPublic = path.join(__dirname, '..', 'apps', 'web', 'public');
  const webApp = path.join(__dirname, '..', 'apps', 'web', 'src', 'app');
  
  fs.writeFileSync(path.join(webPublic, 'apple-touch-icon.png'), png64);
  fs.writeFileSync(path.join(webPublic, 'icon.png'), png32);
  fs.writeFileSync(path.join(webApp, 'icon.png'), png32);

  // Build ICO with 32x32 PNG inside
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0); // width
  dirEntry.writeUInt8(32, 1); // height
  dirEntry.writeUInt8(0, 2);  // color count
  dirEntry.writeUInt8(0, 3);  // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(32, 6); // bits per pixel
  dirEntry.writeUInt32LE(png32.length, 8); // image size
  dirEntry.writeUInt32LE(22, 12); // image offset

  const ico = Buffer.concat([header, dirEntry, png32]);
  fs.writeFileSync(path.join(webPublic, 'favicon.ico'), ico);
  fs.writeFileSync(path.join(webApp, 'favicon.ico'), ico);

  console.log('Favicon generation successful:');
  console.log('- public/favicon.ico (' + ico.length + ' bytes)');
  console.log('- public/apple-touch-icon.png (' + png64.length + ' bytes)');
  console.log('- public/icon.svg');
  console.log('- src/app/icon.svg');
  console.log('- src/app/favicon.ico');
}

main().catch((err) => {
  console.error('Failed to generate favicon:', err);
  process.exit(1);
});
