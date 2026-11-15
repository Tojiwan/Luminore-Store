const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('gallery arrows wrap both ends without scrolling through intermediate slides', () => {
  let Slider;
  const source = fs.readFileSync('assets/global.js', 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('class SliderComponent'), source.indexOf('class SlideshowComponent')), {
    HTMLElement: class {},
    customElements: { define: (_, value) => { Slider = value; } },
  });
  const slider = Object.create(Slider.prototype);
  const moves = [];
  Object.assign(slider, {
    isLuminoreGallery: true, totalPages: 9, currentPage: 9, sliderItemOffset: 300,
    slider: { scrollLeft: 2400, scrollTo: value => moves.push(value) },
  });
  const click = name => slider.onButtonClick({ preventDefault() {}, currentTarget: { name, dataset: {} } });
  click('next');
  assert.equal(moves.pop().left, 0);
  slider.currentPage = 1;
  slider.slider.scrollLeft = 0;
  click('previous');
  assert.equal(moves.pop().left, 2400);
  click('next');
  assert.equal(moves.pop().left, 300);
  slider.isLuminoreGallery = false;
  click('previous');
  assert.equal(moves.pop().left, -300, 'other sliders retain their original navigation');
});

test('Luminore slide changes register immediately; default gallery keeps its debounce', () => {
  for (const luminore of [true, false]) {
    let Gallery, delay;
    const elements = { addEventListener() {}, querySelectorAll: () => [] };
    vm.runInNewContext(fs.readFileSync('assets/media-gallery.js', 'utf8'), {
      HTMLElement: class {
        querySelector() { return elements; }
        closest() { return luminore ? {} : null; }
        dataset = { desktopLayout: 'thumbnail' };
      },
      window: { matchMedia: () => ({ matches: false }) },
      debounce: (callback, milliseconds) => { delay = milliseconds; return callback; },
      customElements: { get() {}, define: (_, value) => { Gallery = value; } },
    });
    new Gallery();
    assert.equal(delay, luminore ? undefined : 500);
  }
});

test('desktop thumbnail rail reveals selected items without horizontal scrolling', () => {
  let Gallery;
  vm.runInNewContext(fs.readFileSync('assets/media-gallery.js', 'utf8'), {
    HTMLElement: class {},
    customElements: { get() {}, define: (_, value) => { Gallery = value; } },
  });
  const gallery = Object.create(Gallery.prototype);
  const scrolls = [];
  const rail = { scrollTop: 100, clientHeight: 200, scrollTo: (value) => scrolls.push(value) };
  const button = { setAttribute() {}, removeAttribute() {} };
  const thumbnail = { offsetTop: 350, offsetLeft: 350, clientHeight: 54, querySelector: () => button };
  gallery.closest = () => ({});
  gallery.mql = { matches: true };
  gallery.elements = { thumbnails: { slider: rail, querySelectorAll: () => [button], isSlideVisible: () => false } };
  gallery.setActiveThumbnail(thumbnail);
  assert.equal(scrolls.pop().top, 204);
  thumbnail.offsetTop = 20;
  gallery.setActiveThumbnail(thumbnail);
  assert.equal(scrolls.pop().top, 20);
  thumbnail.offsetTop = 150;
  gallery.setActiveThumbnail(thumbnail);
  assert.equal(scrolls.length, 0);
  gallery.closest = () => null;
  gallery.setActiveThumbnail(thumbnail);
  assert.equal(scrolls.pop().left, 350, 'default PDP retains horizontal thumbnail scrolling');
});
