const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'contact-form.js'), 'utf8');

function fixture(fetcher, valid = true) {
  let handler;
  const requests = [];
  const timers = new Map();
  const button = { disabled: false, textContent: 'Submit & Get Free Audit →' };
  const status = () => ({ hidden: true, textContent: '', focus() { this.focused = true; } });
  const success = status(), error = status();
  const form = {
    hidden: false,
    dataset: { endpoint: 'https://formsubmit.co/ajax/test@example.invalid' },
    attributes: {},
    querySelector: () => button,
    reportValidity: () => valid,
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, listener) { handler = listener; },
    submit() { assert.fail('The handler must never automatically repeat a POST'); }
  };
  vm.runInNewContext(source, {
    document: { getElementById: id => ({ 'contact-form': form, 'form-success': success, 'form-error': error })[id] },
    FormData: class {}, AbortController,
    setTimeout: (fn, delay) => { assert.equal(delay, 15000); timers.set(1, fn); return 1; },
    clearTimeout: id => timers.delete(id),
    fetch: async (...args) => { requests.push(args); return fetcher(...args); }
  });
  return { form, button, success, error, requests, timers, submit: () => handler({ preventDefault() {} }) };
}

for (const accepted of [true, 'true']) {
  test(`shows success only for an acknowledged submission (${accepted}, ${typeof accepted})`, async () => {
    const f = fixture(async () => ({ ok: true, json: async () => ({ success: accepted }) }));
    await f.submit();
    assert.equal(f.form.hidden, true);
    assert.equal(f.success.hidden, false);
    assert.equal(f.success.focused, true);
    assert.equal(f.error.hidden, true);
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0][1].method, 'POST');
    assert.equal(f.button.disabled, false);
    assert.equal(f.timers.size, 0);
  });
}

for (const payload of [{ success: false }, { success: 'false' }, {}, null, { success: 1 }]) {
  test(`rejects an HTTP 200 with an unconfirmed payload: ${JSON.stringify(payload)}`, async () => {
    const f = fixture(async () => ({ ok: true, json: async () => payload }));
    await f.submit();
    assert.equal(f.form.hidden, false);
    assert.equal(f.success.hidden, true);
    assert.equal(f.error.hidden, false);
    assert.equal(f.error.focused, true);
    assert.equal(f.button.disabled, false);
    assert.equal(f.button.textContent, 'Submit & Get Free Audit →');
    assert.equal(f.requests.length, 1);
    assert.equal(f.timers.size, 0);
  });
}

test('rejects HTTP errors even when their body says success', async () => {
  const f = fixture(async () => ({ ok: false, json: async () => ({ success: true }) }));
  await f.submit();
  assert.equal(f.success.hidden, true);
  assert.equal(f.error.hidden, false);
});

test('keeps details available after malformed JSON or a network failure', async () => {
  for (const fetcher of [
    async () => ({ ok: true, json: async () => { throw new Error('Invalid JSON'); } }),
    async () => { throw new Error('Network failed'); }
  ]) {
    const f = fixture(fetcher);
    await f.submit();
    assert.equal(f.form.hidden, false);
    assert.equal(f.success.hidden, true);
    assert.equal(f.error.hidden, false);
    assert.equal(f.button.disabled, false);
    assert.equal(f.requests.length, 1);
  }
});

test('prevents duplicate submissions while the first request is pending', async () => {
  let resolve;
  const f = fixture(() => new Promise(done => { resolve = done; }));
  const pending = f.submit();
  await f.submit();
  assert.equal(f.requests.length, 1);
  assert.equal(f.button.disabled, true);
  assert.equal(f.form.attributes['aria-busy'], 'true');
  resolve({ ok: true, json: async () => ({ success: true }) });
  await pending;
  assert.equal(f.form.attributes['aria-busy'], undefined);
});

test('times out a stalled request and allows a deliberate retry', async () => {
  const f = fixture((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Aborted')));
  }));
  const pending = f.submit();
  f.timers.get(1)();
  await pending;
  assert.equal(f.error.hidden, false);
  assert.equal(f.form.hidden, false);
  assert.equal(f.button.disabled, false);
  assert.equal(f.timers.size, 0);
});

test('allows a successful manual retry after a rejection', async () => {
  let attempt = 0;
  const f = fixture(async () => ({ ok: true, json: async () => ({ success: ++attempt > 1 }) }));
  await f.submit();
  await f.submit();
  assert.equal(f.requests.length, 2);
  assert.equal(f.success.hidden, false);
  assert.equal(f.error.hidden, true);
});

test('does not send invalid forms', async () => {
  const f = fixture(async () => assert.fail('Invalid form was sent'), false);
  await f.submit();
  assert.equal(f.requests.length, 0);
});

test('is safe to include on a page without a contact form', () => {
  vm.runInNewContext(source, { document: { getElementById: () => null } });
});
