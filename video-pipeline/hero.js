const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [port, jobsJson, prefix] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(`http://127.0.0.1:${port}/index.html`); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  for (const [i, [t, cam, opts]] of JSON.parse(jobsJson).entries()) { const d = await p.evaluate(([t, c, o]) => window.renderHero(t, c, o || {}), [t, cam, opts]); fs.writeFileSync(`${prefix}${i}.png`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close();
})();
