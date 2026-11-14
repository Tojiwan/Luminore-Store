const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('image and iframe films need no native playback controller', () => {
  let Film;
  vm.runInNewContext(fs.readFileSync('assets/luminore-product-film.js', 'utf8'), {
    HTMLElement: class { querySelector() { return null; } },
    customElements: { get() {}, define: (_, value) => { Film = value; } },
  });
  const film = new Film();
  assert.doesNotThrow(() => film.connectedCallback());
  assert.doesNotThrow(() => film.disconnectedCallback());
});

test('film respects reduced motion, offscreen pause, and manual pause', () => {
  let Film, intersect;
  const observers = [];
  let loads = 0;
  let plays = 0, pauses = 0, disconnected = false;
  const video = { load: () => loads++, play: () => { plays++; return Promise.resolve(); }, pause: () => pauses++ };
  const motion = { matches: true, addEventListener() {}, removeEventListener() {} };
  vm.runInNewContext(fs.readFileSync('assets/luminore-product-film.js', 'utf8'), {
    HTMLElement: class { querySelector() { return video; } },
    customElements: { get() {}, define: (_, value) => { Film = value; } },
    matchMedia: () => motion,
    IntersectionObserver: class {
      constructor(callback, options) { intersect = callback; observers.push({ callback, options }); }
      observe() {}
      disconnect() { disconnected = true; }
    },
  });
  const film = new Film();
  film.connectedCallback();
  const buffer = observers.find(({ options }) => options.rootMargin);
  assert.ok(buffer, 'a separate near-viewport observer buffers without playing');
  intersect = observers.find(({ options }) => !options.rootMargin).callback;
  buffer.callback([{ isIntersecting: true }]);
  assert.equal(loads, 0, 'reduced motion avoids speculative buffering');
  intersect([{ isIntersecting: true }]);
  assert.equal(plays, 0);
  motion.matches = false;
  buffer.callback([{ isIntersecting: true }]);
  buffer.callback([{ isIntersecting: true }]);
  assert.equal(loads, 1);
  assert.equal(video.preload, 'auto');
  assert.equal(plays, 0, 'buffering must not start playback');
  intersect([{ isIntersecting: true }]);
  assert.equal(plays, 1);
  intersect([{ isIntersecting: false }]);
  assert.equal(pauses, 1);
  intersect([{ isIntersecting: true }]);
  assert.equal(plays, 1);
  motion.matches = true;
  film.onMotion();
  assert.equal(pauses, 2);
  film.disconnectedCallback();
  assert.equal(disconnected, true);
});
