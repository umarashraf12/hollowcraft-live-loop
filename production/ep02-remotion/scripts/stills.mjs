// Review stills: node scripts/stills.mjs <outDir> [episodeSecond ...]
// Without seconds, grabs the middle frame of every cut in src/edit.json.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import edit from '../src/edit.json' with {type: 'json'};

const outDir = process.argv[2] ?? 'out/stills';
fs.mkdirSync(outDir, {recursive: true});
let seconds = process.argv.slice(3).map(Number);
if (seconds.length === 0) {
  let t = 0;
  for (const s of edit.scenes) for (const c of s.cuts) {
    seconds.push(t + c.dur * 0.6);
    t += c.dur;
  }
}
const browserExecutable = process.env.REMOTION_CHROME ?? '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const opts = {serveUrl, inputProps: {withAudio: false}, browserExecutable, chromiumOptions: {gl: 'swangle'}};
const composition = await selectComposition({...opts, id: 'Episode'});
for (const [i, s] of seconds.entries()) {
  const frame = Math.min(Math.round(s * edit.fps), composition.durationInFrames - 1);
  const output = path.join(outDir, `${String(i).padStart(3, '0')}_t${s.toFixed(1)}.jpg`);
  await renderStill({...opts, composition, frame, output, imageFormat: 'jpeg'});
}
console.log(`rendered ${seconds.length} stills to ${outDir}`);
