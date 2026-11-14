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
  let plays = 0, pauses = 0, disconnected = false;
  const video = { play: () => { plays++; return Promise.resolve(); }, pause: () => pauses++ };
  const motion = { matches: true, addEventListener() {}, removeEventListener() {} };
  vm.runInNewContext(fs.readFileSync('assets/luminore-product-film.js', 'utf8'), {
    HTMLElement: class { querySelector() { return video; } },
    customElements: { get() {}, define: (_, value) => { Film = value; } },
    matchMedia: () => motion,
    IntersectionObserver: class {
      constructor(callback) { intersect = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
  });
  const film = new Film();
  film.connectedCallback();
  intersect([{ isIntersecting: true }]);
  assert.equal(plays, 0);
  motion.matches = false;
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
