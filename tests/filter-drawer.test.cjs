const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const registry = new Map();
vm.runInNewContext(fs.readFileSync('assets/luminore-filter-drawer.js', 'utf8'), {
  HTMLElement: class {}, URLSearchParams, URL, FormData,
  customElements: { get: n => registry.get(n), define: (n, c) => registry.set(n, c) },
});
const Drawer = registry.get('luminore-filter-drawer');
test('Apply replaces filters, resets pagination and preserves sorting and context', () => {
  const params = Drawer.buildParams('filter.p.vendor=Old&page=3&sort_by=price-descending&q=ring&preview_theme_id=42', [['filter.p.product_type', 'Rings'], ['filter.p.product_type', 'Earrings']]);
  assert.equal(params.get('page'), null);
  assert.equal(params.get('filter.p.vendor'), null);
  assert.deepEqual(Array.from(params.getAll('filter.p.product_type')), ['Rings', 'Earrings']);
  assert.equal(params.get('sort_by'), 'price-descending');
  assert.equal(params.get('q'), 'ring');
  assert.equal(params.get('preview_theme_id'), '42');
});
test('Blank price inputs are omitted; clear preserves collection query context', () => {
  const params = Drawer.buildParams('filter.v.price.gte=12&sort_by=title-ascending', [['filter.v.price.gte', ''], ['filter.v.price.lte', '0']]);
  assert.equal(params.has('filter.v.price.gte'), false);
  assert.equal(params.get('filter.v.price.lte'), '0');
  assert.equal(Drawer.buildParams(params.toString(), []).toString(), 'sort_by=title-ascending');
});
test('Price bounds clamp and cannot cross, including zero and decimals', () => {
  assert.equal(Drawer.clampPrice('999', 12.5, 100), 100);
  assert.equal(Drawer.clampPrice('-5', 0, 100), 0);
  assert.equal(Drawer.clampPrice('2', 12.5, 100), 12.5);
  assert.equal(Drawer.clampPrice('12.75', 0, 100), 12.75);
  assert.equal(Drawer.clampPrice('invalid', 0, 100), 0);
});
