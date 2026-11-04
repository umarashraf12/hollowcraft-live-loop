const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('http://127.0.0.1:8771/index.html'); await p.waitForFunction(() => window.READY, null, { timeout: 120000 });
  fs.writeFileSync('timeline.json', JSON.stringify(await p.evaluate(() => window.TIMELINE))); await b.close(); })();
