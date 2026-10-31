const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [s, ...times] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(`http://127.0.0.1:8769/index.html?s=${s}`); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  fs.mkdirSync('stills', { recursive: true });
  for (const t of times) { const d = await p.evaluate(t => window.renderFrame(t), Number(t)); fs.writeFileSync(`stills/s${s}_${t}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close();
})();
