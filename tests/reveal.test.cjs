const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'global.js'), 'utf8');

function fixture({ observer = true, reducedMotion = false, observerThrows = false } = {}) {
  const classes = new Set(['reveal']);
  const attributes = new Map();
  const element = {
    classList: { add: name => classes.add(name) },
    getBoundingClientRect: () => ({ top: 5000, bottom: 6000 }),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name)
  };
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.observed = []; observers.push(this); }
    observe(target) {
      if (observerThrows) throw new Error('Observer failed to register');
      this.observed.push(target);
    }
    unobserve() {}
  }
  const window = {
    innerHeight: 900, scrollY: 0,
    location: { pathname: '/blog/lead-ads-vs-website-leads' },
    addEventListener() {}, matchMedia: () => ({ matches: reducedMotion })
  };
  const sandbox = {
    window,
    document: {
      getElementById: () => null,
      querySelectorAll: selector => selector.startsWith('.reveal,') ? [element] : []
    },
    requestAnimationFrame: callback => callback(),
    setTimeout: callback => callback()
  };
  if (observer) { window.IntersectionObserver = Observer; sandbox.IntersectionObserver = Observer; }
  return { run: () => vm.runInNewContext(source, sandbox), classes, attributes, element, observers };
}

test('keeps offscreen article copy visible when IntersectionObserver is unavailable', () => {
  const f = fixture({ observer: false }); f.run();
  assert.equal(f.classes.has('visible'), true);
  assert.equal(f.attributes.has('data-reveal-pending'), false);
});

test('does not hide content or animate counters when reduced motion is requested', () => {
  const f = fixture({ reducedMotion: true }); f.run();
  assert.equal(f.observers.length, 0);
  assert.equal(f.classes.has('visible'), true);
  assert.equal(f.attributes.has('data-reveal-pending'), false);
});

test('reveals observed content when it enters the viewport', () => {
  const f = fixture(); f.run();
  assert.equal(f.attributes.has('data-reveal-pending'), true);
  assert.ok(f.observers[0].observed.includes(f.element));
  f.observers[0].callback([{ isIntersecting: true, target: f.element }]);
  assert.equal(f.classes.has('visible'), true);
  assert.equal(f.attributes.has('data-reveal-pending'), false);
});

test('does not hide content when observer registration fails', () => {
  const f = fixture({ observerThrows: true });
  assert.throws(f.run, /Observer failed/);
  assert.equal(f.attributes.has('data-reveal-pending'), false);
});
