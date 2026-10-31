const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');

const SCRIPT = readFileSync('assets/luminore-parallax.js', 'utf8');

function load(options = {}) {
  const elements = {};
  const queries = [];
  const listeners = new Map();
  const frames = new Map();
  let frame = 0;
  const context = {
    HTMLElement: class {},
    customElements: { define: (name, value) => { elements[name] = value; } },
    matchMedia: query => {
      const result = {
        matches: query.includes('reduced')
          ? Boolean(options.reduced)
          : query.includes('1099')
            ? Boolean(options.tablet)
            : query.includes('749')
              ? Boolean(options.mobile)
              : false,
        addEventListener: (_, fn) => { result.change = fn; },
        removeEventListener: () => {},
      };
      queries.push(result);
      return result;
    },
    window: {
      innerHeight: options.innerHeight ?? 800,
      addEventListener: (event, fn) => listeners.set(event, fn),
      removeEventListener: event => listeners.delete(event),
    },
    document: { addEventListener() {}, querySelectorAll: () => [], activeElement: null },
    requestAnimationFrame: fn => { frames.set(++frame, fn); return frame; },
    cancelAnimationFrame: id => frames.delete(id),
    getComputedStyle: options.getComputedStyle ?? (() => ({ top: '100px' })),
  };
  vm.runInNewContext(SCRIPT, context);
  return { elements, queries, listeners, frames, context };
}

function makeLayer(speed) {
  const values = new Map();
  return {
    dataset: { speed: String(speed) },
    style: {
      setProperty: (key, value) => values.set(key, value),
      removeProperty: key => values.delete(key),
    },
    values,
  };
}

function setupParallax(options = {}) {
  const env = load(options);
  const Parallax = env.elements['luminore-parallax'];
  assert.ok(Parallax, 'luminore-parallax is defined');
  const element = new Parallax();
  const styles = new Map();
  element.style = {
    setProperty: (key, value) => styles.set(key, value),
    removeProperty: key => styles.delete(key),
  };
  element.hasAttribute = () => true;
  element.getBoundingClientRect = () => options.rect ?? ({ top: -400, bottom: 400, height: 800 });
  const layers = options.layers ?? [makeLayer(0.55), makeLayer(1), makeLayer(-0.3)];
  element.querySelectorAll = () => layers;
  element.connectedCallback();
  return { ...env, element, styles, layers };
}

function makeLink() {
  const attrs = new Map();
  const link = {
    attrs,
    setAttribute: (key, value) => attrs.set(key, value),
    removeAttribute: key => attrs.delete(key),
    hasAttribute: key => attrs.has(key),
    focus: () => { link.focused = true; },
    focused: false,
  };
  return link;
}

function makeCard(top, options = {}) {
  const values = new Map();
  const link = options.link === false ? null : makeLink();
  const card = {
    top,
    values,
    link,
    style: {
      setProperty: (key, value) => values.set(key, value),
      removeProperty: key => values.delete(key),
    },
    getBoundingClientRect: () => ({ top: card.top, bottom: card.top + 600, height: 600 }),
    querySelector: selector => selector === '[data-stack-link]' ? link : null,
  };
  return card;
}

function setupStack(options = {}) {
  const env = load(options);
  const Stack = env.elements['luminore-stack'];
  assert.ok(Stack, 'luminore-stack is defined');
  const element = new Stack();
  const classes = new Set();
  element.classList = {
    add: name => classes.add(name),
    remove: name => classes.delete(name),
    contains: name => classes.has(name),
  };
  const cards = options.cards ?? [makeCard(100), makeCard(460), makeCard(820)];
  element.querySelectorAll = selector => selector === '[data-stack-card]' ? cards : [];
  element.getBoundingClientRect = () => ({ top: 0, bottom: 3000, height: 3000 });
  element.connectedCallback();
  return { ...env, element, cards, classes };
}

function runFrame(frames) {
  const next = [...frames.values()][0];
  assert.ok(next, 'a frame was scheduled');
  next();
}

test('parallax applies each layer speed once', () => {
  const { layers } = setupParallax();
  assert.equal(layers[0].values.get('--lm-speed'), '0.55');
  assert.equal(layers[1].values.get('--lm-speed'), '1');
  assert.equal(layers[2].values.get('--lm-speed'), '-0.3');
});

test('scroll updates are coalesced, bounded and cleaned up on disconnect', () => {
  const { element, styles, listeners, frames } = setupParallax();
  assert.ok(Math.abs(parseFloat(styles.get('--lm-offset'))) <= 64);
  const initial = styles.get('--lm-offset');
  element.getBoundingClientRect = () => ({ top: 0, bottom: 800, height: 800 });
  listeners.get('scroll')();
  listeners.get('scroll')();
  assert.equal(frames.size, 1);
  runFrame(frames);
  assert.notEqual(styles.get('--lm-offset'), initial);
  element.disconnectedCallback();
  assert.equal(listeners.size, 0);
});

test('tablet drift is capped at 40px', () => {
  const { styles } = setupParallax({
    tablet: true,
    rect: { top: -8000, bottom: 0, height: 8000 },
  });
  assert.equal(styles.get('--lm-offset'), '40.00px');
});

test('reduced motion disables movement and responds to a live preference change', () => {
  const { styles, queries, listeners } = setupParallax({ reduced: true });
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
  const desktop = parseFloat(setupParallax({
    rect: { top: -8000, bottom: 0, height: 8000 },
  }).styles.get('--lm-offset'));
  const mobile = parseFloat(setupParallax({
    mobile: true,
    rect: { top: -8000, bottom: 0, height: 8000 },
  }).styles.get('--lm-offset'));
  assert.ok(Math.abs(mobile) < Math.abs(desktop));
});

test('stack initialises ready state and bounded enter/recede progress', () => {
  const { cards, classes } = setupStack();
  assert.equal(classes.has('lm-stack--ready'), true);
  assert.equal(cards[0].values.get('--lm-enter'), '1.000');
  assert.equal(cards[0].values.get('--lm-recede'), '0.000');
  assert.equal(cards[1].values.get('--lm-enter'), '0.000');
  assert.equal(cards[2].values.get('--lm-enter'), '0.000');
  cards.forEach(card => {
    ['--lm-enter', '--lm-recede'].forEach(key => {
      const value = parseFloat(card.values.get(key));
      assert.ok(value >= 0 && value <= 1, `${key} stays within 0..1`);
    });
    const scale = parseFloat(card.values.get('--lm-card-scale'));
    assert.ok(scale >= 0.94 && scale <= 1, 'card scale stays within 0.94..1');
    const lift = parseFloat(card.values.get('--lm-card-lift'));
    assert.ok(lift >= -8 && lift <= 0, 'card lift stays within 0..-8px');
  });
});

test('stack recedes the covered card and removes its link from tab order', () => {
  const { cards, listeners, frames } = setupStack();
  cards[1].top = 100;
  listeners.get('scroll')();
  runFrame(frames);
  assert.equal(cards[0].values.get('--lm-recede'), '1.000');
  assert.equal(cards[0].link.attrs.get('tabindex'), '-1');
  assert.equal(cards[1].values.get('--lm-enter'), '1.000');
});

test('stack moves focus from a covered link to the covering card', () => {
  const { cards, listeners, frames, context } = setupStack();
  context.document.activeElement = cards[0].link;
  cards[1].top = 100;
  listeners.get('scroll')();
  runFrame(frames);
  assert.equal(cards[0].link.focused, false);
  assert.equal(cards[1].link.focused, true);
});

test('stack restores link tab order when the next card moves away', () => {
  const { cards, listeners, frames } = setupStack();
  cards[1].top = 100;
  listeners.get('scroll')();
  runFrame(frames);
  cards[1].top = 460;
  listeners.get('scroll')();
  runFrame(frames);
  assert.equal(cards[0].link.hasAttribute('tabindex'), false);
});

test('stack stays in normal flow for reduced motion and responds to live changes', () => {
  const { cards, classes, queries, listeners } = setupStack({ reduced: true });
  assert.equal(classes.has('lm-stack--ready'), false);
  assert.equal(cards[0].values.has('--lm-enter'), false);
  assert.equal(listeners.has('scroll'), false);
  queries[0].matches = false;
  queries[0].change();
  assert.equal(classes.has('lm-stack--ready'), true);
  assert.ok(cards[0].values.has('--lm-enter'));
  queries[0].matches = true;
  queries[0].change();
  assert.equal(classes.has('lm-stack--ready'), false);
  assert.equal(cards[0].values.has('--lm-enter'), false);
  assert.equal(listeners.has('scroll'), false);
});

test('stack cleans up listeners and frame on disconnect', () => {
  const { element, listeners, frames } = setupStack();
  assert.equal(listeners.has('scroll'), true);
  element.disconnectedCallback();
  assert.equal(listeners.size, 0);
  assert.equal(frames.size, 0);
});
