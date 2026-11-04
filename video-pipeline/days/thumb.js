const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const shots = JSON.parse(process.argv[2]);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } }); p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://127.0.0.1:8771/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  fs.mkdirSync('thumbs', { recursive: true });
  for (const [name, t, ov] of shots) { const d = await p.evaluate(([t, ov]) => window.renderFrame(t, ov), [t, ov]); fs.writeFileSync(`thumbs/${name}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close(); })();
