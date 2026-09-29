import assert from 'node:assert/strict'
import test from 'node:test'
import { getLocation } from '../src/services/openMeteo.ts'

const location = { name: 'São Paulo', country_code: 'BR', latitude: -23.55, longitude: -46.63, timezone: 'America/Sao_Paulo' }
const unavailable = { ok: false, reason: 'unavailable' }
const reply = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })

test('invalid inputs never call fetch', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected call') })
  for (const city of ['', ' \n\t ', undefined, null, 42, {}, []]) {
    assert.deepEqual(await getLocation(city), { ok: false, reason: 'invalid-input' })
  }
  assert.equal(fetch.mock.callCount(), 0)
})

test('encodes trimmed names and uses exactly the geocoding parameters in one request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => reply({ results: [location] }))
  for (const city of ['  São Paulo  ', 'São Tomé & Príncipe?']) {
    assert.deepEqual(await getLocation(city), { ok: true, data: location })
    const [url, options] = fetch.mock.calls.at(-1).arguments
    assert.equal(url.origin, 'https://geocoding-api.open-meteo.com')
    assert.equal(url.pathname, '/v1/search')
    assert.deepEqual(Object.fromEntries(url.searchParams), { name: city.trim(), count: '1', language: 'pt', format: 'json' })
    assert.ok(options.signal instanceof AbortSignal)
  }
  assert.equal(fetch.mock.callCount(), 2)
})

test('selects first valid location and preserves zero coordinates', async (t) => {
  const zero = { ...location, latitude: 0, longitude: 0 }
  t.mock.method(globalThis, 'fetch', async () => reply({ results: [null, zero, location] }))
  assert.deepEqual(await getLocation('São Paulo'), { ok: true, data: zero })
})

test('empty and missing results return not-found', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  for (const payload of [{}, { results: [] }]) {
    fetch.mock.mockImplementation(async () => reply(payload))
    assert.deepEqual(await getLocation('Cidade'), { ok: false, reason: 'not-found' })
  }
  assert.equal(fetch.mock.callCount(), 2)
})

test('malformed responses, invalid locations and provider errors are controlled', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  const payloads = [null, [], 'invalid', { results: null }, { results: {} },
    { results: [{ ...location, timezone: 'invalid' }] }, { results: [{ name: 'Cidade' }] },
    { error: true, reason: 'provider error', results: [location] }]
  for (const payload of payloads) {
    fetch.mock.mockImplementation(async () => reply(payload))
    assert.deepEqual(await getLocation('Cidade'), unavailable)
  }
  assert.equal(fetch.mock.callCount(), payloads.length)
})

test('HTTP errors, invalid JSON and network errors return without retries', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  for (const implementation of [
    async () => new Response('error', { status: 429 }),
    async () => new Response('error', { status: 500 }),
    async () => new Response('{invalid json'),
    async () => { throw new TypeError('network failure') },
  ]) {
    fetch.mock.mockImplementation(implementation)
    assert.deepEqual(await getLocation('Cidade'), unavailable)
  }
  assert.equal(fetch.mock.callCount(), 4)
})

function waitForAbort(signal) {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  })
}

test('already cancelled requests never call fetch', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  const controller = new AbortController()
  controller.abort()
  assert.deepEqual(await getLocation('Cidade', controller.signal), unavailable)
  assert.equal(fetch.mock.callCount(), 0)
})

test('cancellation aborts pending fetch and removes the external listener', async (t) => {
  const controller = new AbortController()
  const remove = t.mock.method(controller.signal, 'removeEventListener')
  const fetch = t.mock.method(globalThis, 'fetch', (_, { signal }) => waitForAbort(signal))
  const pending = getLocation('Cidade', controller.signal)
  controller.abort()
  assert.deepEqual(await pending, unavailable)
  assert.equal(fetch.mock.callCount(), 1)
  assert.equal(remove.mock.callCount(), 1)
  assert.equal(remove.mock.calls[0].arguments[0], 'abort')
})

test('15-second timeout aborts pending fetch without retries', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const fetch = t.mock.method(globalThis, 'fetch', (_, { signal }) => waitForAbort(signal))
  const pending = getLocation('Cidade')
  const signal = fetch.mock.calls[0].arguments[1].signal
  t.mock.timers.tick(14_999)
  assert.equal(signal.aborted, false)
  t.mock.timers.tick(1)
  assert.deepEqual(await pending, unavailable)
  assert.equal(signal.aborted, true)
  assert.equal(fetch.mock.callCount(), 1)
})

for (const cause of ['timeout', 'cancellation']) {
  test(`${cause} also interrupts response body reading`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] })
    const controller = new AbortController()
    let bodyStarted = false
    t.mock.method(globalThis, 'fetch', async (_, { signal }) => ({
      ok: true,
      json: () => { bodyStarted = true; return waitForAbort(signal) },
    }))
    const pending = getLocation('Cidade', controller.signal)
    await Promise.resolve()
    assert.equal(bodyStarted, true)
    if (cause === 'timeout') t.mock.timers.tick(15_000)
    else controller.abort()
    assert.deepEqual(await pending, unavailable)
  })
}

test('finished requests clean up timers and listeners', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const controller = new AbortController()
  const remove = t.mock.method(controller.signal, 'removeEventListener')
  const fetch = t.mock.method(globalThis, 'fetch', async () => reply({ results: [location] }))
  assert.deepEqual(await getLocation('Cidade', controller.signal), { ok: true, data: location })
  const signal = fetch.mock.calls[0].arguments[1].signal
  controller.abort()
  t.mock.timers.tick(15_000)
  assert.equal(signal.aborted, false)
  assert.equal(remove.mock.callCount(), 1)
})
