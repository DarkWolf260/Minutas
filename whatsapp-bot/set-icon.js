const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function ensureIcon() {
  const iconPath = path.join(__dirname, 'icon.ico');
  const webpPath = path.join(__dirname, 'WhatsApp.webp');

  // Si existe WhatsApp.webp, convertirlo a icon.ico
  if (fs.existsSync(webpPath)) {
    try {
      console.log('[Icono] Convirtiendo WhatsApp.webp a icon.ico de alta resolución...');
      const puppeteer = require('puppeteer');
      const { getEdgeExecutablePath } = require('./src/client');
      
      const browser = await puppeteer.launch({
        executablePath: getEdgeExecutablePath(),
        headless: true,
        args: ['--no-sandbox', '--disable-gpu']
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 256, height: 256, deviceScaleFactor: 1 });
      const base64 = fs.readFileSync(webpPath).toString('base64');
      await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;"><img src="data:image/webp;base64,${base64}" style="width:256px;height:256px;object-fit:contain;" /></body></html>`);
      const pngBuffer = await page.screenshot({ omitBackground: true, type: 'png' });
      await browser.close();

      const header = Buffer.from([0, 0, 1, 0, 1, 0]);
      const entry = Buffer.alloc(16);
      entry.writeUInt8(0, 0); // 256px width
      entry.writeUInt8(0, 1); // 256px height
      entry.writeUInt16LE(1, 4);
      entry.writeUInt16LE(32, 6);
      entry.writeUInt32LE(pngBuffer.length, 8);
      entry.writeUInt32LE(22, 12);
      const ico = Buffer.concat([header, entry, pngBuffer]);
      fs.writeFileSync(iconPath, ico);
      console.log('[Icono] icon.ico generado con éxito desde WhatsApp.webp.');
    } catch (e) {
      console.warn('[Icono] No se pudo convertir WhatsApp.webp, usando icon.ico existente:', e.message);
    }
  }

  const exePath = path.join(__dirname, 'dist', 'MinutasWhatsAppBot.exe');
  if (fs.existsSync(iconPath) && fs.existsSync(exePath)) {
    try {
      console.log('\n[Icono] Inyectando icono en MinutasWhatsAppBot.exe...');
      execSync(`npx resedit-cli --in "${exePath}" --out "${exePath}" --icon 1,"${iconPath}" --ignore-signed`, { stdio: 'inherit' });
      console.log('[Icono] ¡Icono aplicado exitosamente al .exe!\n');
    } catch (err) {
      console.warn('[Icono] Aviso: No se pudo inyectar el icono:', err.message);
    }
  }
}

ensureIcon();
