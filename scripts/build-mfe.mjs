import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outfile = path.join(root, 'blocks', 'store-locator', 'store-locator.bundle.js');

await build({
  entryPoints: [path.join(root, 'micro-frontends', 'store-locator', 'src', 'main.jsx')],
  bundle: true,
  format: 'esm',
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  outfile,
  jsx: 'automatic',
  legalComments: 'none',
});

// Keep source-map paths tied to this project even when dependencies are supplied
// through a local development symlink.
const sourceMapPath = `${outfile}.map`;
const sourceMap = JSON.parse(await fs.readFile(sourceMapPath, 'utf8'));
sourceMap.sources = sourceMap.sources.map((source) => source.replace(
  /ruslan-store-da-msm(?=\/node_modules\/)/g,
  path.basename(root),
));
await fs.writeFile(sourceMapPath, JSON.stringify(sourceMap));

console.log('Built Store Locator React micro-frontend.');
