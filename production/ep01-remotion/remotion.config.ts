import {Config} from '@remotion/cli/config';

// Use the preinstalled headless Chromium; software WebGL via SwiftShader/ANGLE.
Config.setBrowserExecutable(
  process.env.REMOTION_CHROME ??
    '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
);
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
