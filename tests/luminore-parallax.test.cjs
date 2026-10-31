const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup({ reduced = false, mobile = false } = {}) {
  const queries = [];
  const listeners = new Map();
  const frames = new Map();
  let Element, frame = 0;
  const context = {
    HTMLElement: class {},
    customElements: { define: (_, value) => { Element = value; } },
    matchMedia: query => {
      const result = { matches: query.includes('reduced') ? reduced : mobile, addEventListener: (_, fn) => { result.change = fn; }, removeEventListener: () => {} };
      queries.push(result);
      return result;
    },
    window: { innerHeight: 800, addEventListener: (event, fn) => listeners.set(event, fn), removeEventListener: event => listeners.delete(event) },
    document: { addEventListener() {} },
    requestAnimationFrame: fn => { frames.set(++frame, fn); return frame; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  vm.runInNewContext(readFileSync('assets/luminore-parallax.js', 'utf8'), context);
  const element = new Element();
  const styles = new Map();
  element.style = { setProperty: (key, value) => styles.set(key, value), removeProperty: key => styles.delete(key) };
  element.hasAttribute = () => true;
  element.getBoundingClientRect = () => ({ top: -400, bottom: 400, height: 800 });
  element.connectedCallback();
  return { element, styles, queries, listeners, frames };
}

test('scroll updates are coalesced, bounded and cleaned up on disconnect', () => {
  const { element, styles, listeners, frames } = setup();
  assert.ok(Math.abs(parseFloat(styles.get('--lm-offset'))) <= 64);
  const initial = styles.get('--lm-offset');
  element.getBoundingClientRect = () => ({ top: 0, bottom: 800, height: 800 });
  listeners.get('scroll')();
  listeners.get('scroll')();
  assert.equal(frames.size, 1);
  [...frames.values()][0]();
  assert.notEqual(styles.get('--lm-offset'), initial);
  element.disconnectedCallback();
  assert.equal(listeners.size, 0);
});

test('reduced motion disables movement and responds to a live preference change', () => {
  const { styles, queries, listeners } = setup({ reduced: true });
  assert.equal(styles.has('--lm-offset'), false);
  assert.equal(listeners.has('scroll'), false);
  queries[0].matches = false;
  queries[0].change();
  assert.equal(listeners.has('scroll'), true);
  queries[0].matches = true;
  queries[0].change();
  assert.equal(styles.has('--lm-offset'), false);
  assert.equal(listeners.has('scroll'), false);
});

test('mobile movement is smaller than desktop', () => {
  const desktop = parseFloat(setup().styles.get('--lm-offset'));
  const mobile = parseFloat(setup({ mobile: true }).styles.get('--lm-offset'));
  assert.ok(Math.abs(mobile) < Math.abs(desktop));
});
