const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  const jobs = JSON.parse(process.argv[2]);
  for (const [i, [mode, o]] of jobs.entries()) { const d = await p.evaluate(([m, o]) => window.renderThumb2(m, o), [mode, o]); fs.writeFileSync(`thumb_${mode}${i}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close();
})();
