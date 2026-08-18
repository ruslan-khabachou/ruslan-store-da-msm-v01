import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = path.join(root, 'scripts/rollout-msm-org.sh');

function dryRun(extraEnv = {}) {
  return spawnSync('bash', [
    script,
    '--eds-org', 'ruslan-khabachou',
    '--da-org', 'new-da-org-id',
    '--code-owner', 'ruslan-khabachou',
    '--code-repo', 'ruslan-store-da-msm-v01',
  ], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv },
  });
}

test('rollout separates the target DA org from the unchanged GitHub/EDS org', () => {
  const result = dryRun();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /EDS organization: ruslan-khabachou/);
  assert.match(result.stdout, /Target DA organization: new-da-org-id/);
  assert.match(result.stdout, /Shared GitHub code: ruslan-khabachou\/ruslan-store-da-msm-v01@main/);
  assert.match(result.stdout, /da-msm\.adobeaem\.workers\.dev\/new-da-org-id\/base-site\//);
  assert.match(result.stdout, /Provisioning 1 base site\(s\)/);
  assert.match(result.stdout, /Provisioning 3 satellite site\(s\)/);
  assert.ok(result.stdout.indexOf('base-site.json') < result.stdout.indexOf('ca-site.json'));
});

test('rollout handles initially empty arrays in Bash 3.2 compatibility mode', () => {
  const result = dryRun({ BASH_COMPAT: '3.2' });
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /unbound variable/);
  assert.match(result.stdout, /Dry-run completed/);
});

test('legacy provision entry point delegates to the rollout implementation', () => {
  const result = spawnSync('bash', [
    path.join(root, 'scripts/provision-eds-sites.sh'),
    '--eds-org', 'ruslan-khabachou',
    '--da-org', 'new-da-org-id',
    '--code-owner', 'ruslan-khabachou',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Target DA organization: new-da-org-id/);
});
