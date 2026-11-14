const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('slider initializes once, avoids cloned cards, and reinitializes after editor reconnect', () => {
  let Slider, options, starts = 0, destroyed = 0;
  vm.runInNewContext(fs.readFileSync('assets/luminore-styled-with.js', 'utf8'), {
    HTMLElement: class { isConnected = true; querySelector(s) { return s; } },
    customElements: { get() {}, define: (_, value) => { Slider = value; } },
    document: { readyState: 'complete', removeEventListener() {} },
    Swiper: class {
      constructor(_, config) { starts++; options = config; }
      destroy() { destroyed++; }
    },
  });
  const slider = new Slider();
  slider.connectedCallback();
  slider.init();
  assert.equal(starts, 1);
  assert.equal(options.loop, false);
  assert.equal(options.autoplay, false);
  assert.equal(options.slidesPerView, 1.2);
  assert.equal(options.pagination.type, 'fraction');
  assert.equal(options.pagination.formatFractionCurrent(1), '01');
  assert.equal(options.pagination.formatFractionTotal(4), '04');
  assert.equal(options.breakpoints[750].slidesPerView, 2);
  assert.equal(options.breakpoints[1024].slidesPerView, 4);
  slider.disconnectedCallback();
  assert.equal(destroyed, 1);
  slider.connectedCallback();
  assert.equal(starts, 2);
});

test('mobile peek fade keeps the active card content visible', () => {
  const css = fs.readFileSync('assets/luminore-styled-with.css', 'utf8');
  assert.match(css, /@media \(max-width: 749px\)[\s\S]*\.swiper-slide:not\(\.swiper-slide-active\) \.card__content/);
  assert.doesNotMatch(css, /swiper-slide-fully-visible/);
});
