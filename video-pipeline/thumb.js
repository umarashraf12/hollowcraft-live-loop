const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://127.0.0.1:8765/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  const variants = JSON.parse(process.argv[2]);
  for (const [i, v] of variants.entries()) { const d = await p.evaluate(o => window.renderThumb(o), v); fs.writeFileSync(`thumb_raw${i}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close();
})();
