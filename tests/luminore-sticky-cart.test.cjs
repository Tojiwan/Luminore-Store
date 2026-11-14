const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

function setup() {
  let Component;
  const subscriptions = {};
  const formListeners = {};
  const form = {
    querySelector: () => ({ value: '42' }),
    addEventListener: (name, fn) => { formListeners[name] = fn; },
    removeEventListener: (name) => { delete formListeners[name]; },
  };
  const button = { disabled: false, setAttribute() {}, form };
  const label = { textContent: 'Add to cart' };
  const bounds = { bottom: 100, footer: 1000 };
  const buyButtons = { getBoundingClientRect: () => ({ bottom: bounds.bottom }) };
  const main = {
    disabled: false, busy: false,
    getAttribute: () => String(main.busy), hasAttribute: () => false,
    querySelector: () => label, closest: () => buyButtons,
  };
  const price = {
    onSale: false,
    classList: { contains: c => c === 'price--on-sale' ? price.onSale : false },
    querySelector: selector => selector === '.price-item--sale'
      ? { textContent: '$79.00 USD' }
      : { textContent: '₱58,200.00 PHP' },
  };
  const output = { textContent: '' };
  const error = { textContent: '' };
  const image = { src: 'http://localhost/default.jpg', removeAttribute() {} };
  const nodes = { button, img: image, '.lm-pdp__sticky-price': output, '[data-error]': error };
  const removed = [];
  let disconnected = false;
  const sandbox = {
    HTMLElement: class {
      dataset = { section: 'main' };
      querySelector(selector) { return nodes[selector]; }
    },
    customElements: { get: () => false, define: (_, c) => { Component = c; } },
    document: {
      getElementById: () => ({ querySelector: selector => selector.startsWith('product-form') ? main : price }),
      querySelector: () => ({ getBoundingClientRect: () => ({ top: bounds.footer }) }),
      documentElement: { scrollHeight: 3000 },
    },
    matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }),
    MutationObserver: class { observe() {} disconnect() { disconnected = true; } },
    window: { addEventListener() {}, removeEventListener: name => removed.push(name) },
    innerHeight: 667,
    scrollY: 0,
    requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    PUB_SUB_EVENTS: { variantChange: 'variant', cartError: 'error' },
    subscribe: (name, fn) => { subscriptions[name] = fn; return () => delete subscriptions[name]; },
    URL,
    location: { origin: 'http://localhost' },
  };
  vm.runInNewContext(readFileSync('assets/luminore-product.js', 'utf8'), sandbox);
  const sticky = new Component();
  sticky.connectedCallback();
  return { sticky, main, label, bounds, button, price, output, image, error, subscriptions, removed, sandbox, formListeners, disconnected: () => disconnected };
}

test('visibility requires mobile, buy buttons above viewport, footer not scrolled past, and page not at end', () => {
  const { sticky, bounds, sandbox } = setup();
  assert.equal(sticky.hidden, true);
  bounds.bottom = -10;
  sticky.updateVisibility();
  assert.equal(sticky.hidden, false);
  bounds.footer = 600;
  sticky.updateVisibility();
  assert.equal(sticky.hidden, false);
  sandbox.scrollY = 2333;
  sticky.updateVisibility();
  assert.equal(sticky.hidden, true);
  sandbox.scrollY = 0;
  bounds.footer = -1;
  sticky.updateVisibility();
  assert.equal(sticky.hidden, true);
  bounds.footer = 1000;
  sticky.mobile.matches = false;
  sticky.updateVisibility();
  assert.equal(sticky.hidden, true);
});

test('mirrors localized price, sale price, sold-out/unavailable labels, and pending-submit state', () => {
  const { sticky, main, label, price, button, output } = setup();
  assert.equal(output.textContent, '₱58,200.00 PHP');
  price.onSale = true;
  sticky.update();
  assert.equal(output.textContent, '$79.00 USD');
  price.onSale = false;
  sticky.update();
  assert.equal(output.textContent, '₱58,200.00 PHP');
  for (const state of ['Sold out', 'Unavailable']) {
    main.disabled = true;
    label.textContent = state;
    sticky.update();
    assert.equal(button.disabled, true);
    assert.equal(button.textContent, state);
  }
  main.disabled = false;
  main.busy = true;
  sticky.update();
  assert.equal(button.disabled, true);
  main.busy = false;
  sticky.update();
  assert.equal(button.disabled, false);
});

test('scopes variant events, resets images, exposes cart errors, and cleans up listeners', () => {
  const { sticky, image, error, subscriptions, removed, formListeners, disconnected } = setup();
  subscriptions.variant({ data: { sectionId: 'other', variant: {} } });
  assert.equal(image.src, 'http://localhost/default.jpg');
  subscriptions.variant({ data: { sectionId: 'main', variant: { featured_media: { preview_image: { src: 'http://localhost/variant.jpg' } } } } });
  assert.equal(image.src, 'http://localhost/variant.jpg?width=120');
  subscriptions.variant({ data: { sectionId: 'main', variant: {} } });
  assert.equal(image.src, 'http://localhost/default.jpg?width=120');
  subscriptions.error({ productVariantId: 42, errors: 'Not enough stock' });
  assert.equal(error.textContent, 'Not enough stock');
  formListeners.submit();
  assert.equal(error.textContent, '');
  sticky.disconnectedCallback();
  assert.equal(disconnected(), true);
  assert.equal(Object.keys(subscriptions).length, 0);
  assert.equal(formListeners.submit, undefined);
  assert.deepEqual(removed, ['scroll', 'resize']);
});
