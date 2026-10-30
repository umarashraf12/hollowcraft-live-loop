const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  fs.mkdirSync('stills', { recursive: true });
  for (const t of times) { const t0 = Date.now(); const d = await p.evaluate(t => window.renderFrame(t), t); fs.writeFileSync(`stills/t${t}.jpg`, Buffer.from(d.split(',')[1], 'base64')); console.log(t, Date.now() - t0, 'ms'); }
  await b.close();
})();
