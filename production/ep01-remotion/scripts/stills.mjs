// Renders review stills: node scripts/stills.mjs <outDir> [episodeSecond ...]
// Without seconds, grabs one frame from the middle of every shot.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import timeline from '../src/timeline.json' with {type: 'json'};

const outDir = process.argv[2] ?? 'out/stills';
fs.mkdirSync(outDir, {recursive: true});
let seconds = process.argv.slice(3).map(Number);
if (seconds.length === 0) {
  let t = 0;
  for (const s of timeline.shots) {
    seconds.push(t + s.duration * 0.6);
    t += s.duration;
  }
}
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Episode', inputProps: {withAudio: false}, browserExecutable, chromiumOptions: {gl: 'swangle'}});
for (const s of seconds) {
  const frame = Math.min(Math.round(s * timeline.fps), composition.durationInFrames - 1);
  const output = path.join(outDir, `t${String(s.toFixed(1)).padStart(5, '0')}.jpg`);
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', inputProps: {withAudio: false}, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  console.log('still', output);
}
