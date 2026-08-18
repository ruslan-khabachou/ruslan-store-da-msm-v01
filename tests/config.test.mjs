import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(await fs.readFile(path.join(root, 'config/site-matrix.json'), 'utf8'));

test('v01 matrix has one multilingual base and three requested live copies', () => {
  assert.equal(matrix.projectName, 'ruslan-store-da-msm-v01');
  assert.equal(matrix.git.repo, 'ruslan-store-da-msm-v01');
  assert.equal(matrix.baseSite.name, 'base-site');
  assert.deepEqual(matrix.baseSite.locales, ['en', 'fr']);
  assert.deepEqual(matrix.satellites.map((site) => site.name), [
    'ca-site',
    'fr-site',
    'us-site',
  ]);
  assert.deepEqual(matrix.satellites.map((site) => site.locales), [
    ['en', 'fr'],
    ['fr'],
    ['fr'],
  ]);
});

test('all EDS sites share one Git repo and use the target DA org MSM provider', async () => {
  const files = (await fs.readdir(path.join(root, 'config/eds/sites'))).sort();
  assert.deepEqual(files, ['base-site.json', 'ca-site.json', 'fr-site.json', 'us-site.json']);
  await Promise.all(files.map(async (file) => {
    const payload = JSON.parse(await fs.readFile(path.join(root, 'config/eds/sites', file), 'utf8'));
    assert.equal(payload.code.owner, 'ruslan-khabachou');
    assert.equal(payload.code.repo, 'ruslan-store-da-msm-v01');
    assert.equal(payload.content.source.type, 'markup');
    assert.match(payload.content.source.url, /^https:\/\/da-msm\.adobeaem\.workers\.dev\/YOUR_TARGET_DA_ORG\//);
    assert.doesNotMatch(payload.content.source.url, /adobeaemcloud\.com|\/content\//);
  }));
});

test('DA config exports describe MSM, UE, permissions and locale roots', async () => {
  const msm = await fs.readFile(path.join(root, 'config/da/msm.csv'), 'utf8');
  const prepare = await fs.readFile(path.join(root, 'config/da/prepare.csv'), 'utf8');
  const data = await fs.readFile(path.join(root, 'config/da/data.csv'), 'utf8');
  const permissions = await fs.readFile(path.join(root, 'config/da/permissions.csv'), 'utf8');
  const locales = await fs.readFile(path.join(root, 'config/da/site-locales.csv'), 'utf8');

  assert.equal(msm, [
    'base,satellite,title',
    'base-site,,Ruslan Store multilingual base',
    'base-site,ca-site,Ruslan Store Canada',
    'base-site,fr-site,Ruslan Store France',
    'base-site,us-site,Ruslan Store United States',
    '',
  ].join('\n'));
  assert.equal(prepare, 'title,path,icon,ref\nMulti-site Manager,,,\n');
  assert.match(data, /editor\.path,\/YOUR_TARGET_DA_ORG\/base-site=/);
  assert.match(data, /main--ruslan-store-da-msm-v01--ruslan-khabachou\.ue\.da\.live/);
  assert.match(permissions, /CONFIG,ruslan-khabachou\/DA Admins,write/);
  assert.equal(locales.trim().split('\n').length, 7);
});

test('canonical fstab bootstraps Code Sync from the DA base site', async () => {
  const fstab = await fs.readFile(path.join(root, 'fstab.yaml'), 'utf8');
  assert.match(fstab, /https:\/\/content\.da\.live\/YOUR_TARGET_DA_ORG\/base-site\//);
  assert.match(fstab, /type: markup/);
});
