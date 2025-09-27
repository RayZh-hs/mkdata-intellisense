const esbuild = require('esbuild');
const fs = require('fs');

const isProd = process.argv.includes('--production');

esbuild.build({
  entryPoints: ['src/extension.ts'], 
  bundle: true,
  outfile: 'out/extension.js',
  platform: 'node',
  format: 'cjs',
  sourcemap: !isProd,
  external: ['vscode'],
  minify: isProd,
  logLevel: 'info',
}).catch(() => process.exit(1));
