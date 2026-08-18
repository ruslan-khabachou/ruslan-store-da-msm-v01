import assert from 'node:assert/strict';
import test from 'node:test';
import { getLocalizedFragmentPath, getPathLocale } from '../scripts/locale.js';

test('locale is read from the first URL segment', () => {
  assert.equal(getPathLocale('/en/products/widget', 'fr'), 'en');
  assert.equal(getPathLocale('/fr/produits', 'en'), 'fr');
  assert.equal(getPathLocale('/content-samples/base-site/en', 'fr'), 'fr');
});

test('nav and footer default beneath the locale root', () => {
  const location = new URL('https://main--base-site--example.aem.page/fr/produits');
  assert.equal(getLocalizedFragmentPath('nav', '', location, 'en'), '/fr/nav');
  assert.equal(getLocalizedFragmentPath('footer', '', location, 'en'), '/fr/footer');
});

test('explicit fragment metadata overrides locale resolution', () => {
  const location = new URL('https://main--ca-site--example.aem.page/en/products');
  assert.equal(getLocalizedFragmentPath('nav', '/shared/special-nav', location), '/shared/special-nav');
});
