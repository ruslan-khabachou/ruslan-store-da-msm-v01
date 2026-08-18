import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('Universal Editor instrumentation is included for Author Bus', async () => {
  const matrix = JSON.parse(await fs.readFile(path.join(root, 'config/site-matrix.json'), 'utf8'));
  assert.equal(matrix.universalEditor.enabled, true);
  assert.equal(matrix.universalEditor.contentRepository, 'DA Author Bus');
  await Promise.all([
    'ue/scripts/ue.js',
    'component-definition.json',
    'component-definitions.json',
    'component-models.json',
    'component-filters.json',
  ].map((relative) => fs.access(path.join(root, relative))));
});

test('Store Locator is available to Universal Editor', async () => {
  const model = JSON.parse(await fs.readFile(
    path.join(root, 'ue/models/blocks/store-locator.json'),
    'utf8',
  ));
  assert.equal(model.definitions[0].id, 'store-locator');
  const section = JSON.parse(await fs.readFile(path.join(root, 'ue/models/section.json'), 'utf8'));
  assert.ok(section.filters[0].components.includes('store-locator'));
});
