import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('React bundle is generated and remains lazy-loaded by its block', async () => {
  const bundle = await fs.stat(path.join(root, 'blocks/store-locator/store-locator.bundle.js'));
  const wrapper = await fs.readFile(path.join(root, 'blocks/store-locator/store-locator.js'), 'utf8');
  assert.ok(bundle.size > 1000);
  assert.match(wrapper, /await import\('\.\/store-locator\.bundle\.js'\)/);
  assert.match(wrapper, /pathname\.startsWith\('\/api\/'\)/);
});
