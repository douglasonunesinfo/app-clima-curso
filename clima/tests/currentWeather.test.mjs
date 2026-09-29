import assert from 'node:assert/strict'
import test from 'node:test'
import { getCurrentWeather } from '../src/services/openMeteo.ts'

const location = { name: 'São Paulo', country_code: 'BR', latitude: -23.55, longitude: -46.63, timezone: 'America/Sao_Paulo' }
const weather = {
  current: {
    time: '2026-09-28T19:15', temperature_2m: -2.35, relative_humidity_2m: 0,
    apparent_temperature: -5.12, is_day: 0, wind_speed_10m: 0,
    wind_direction_10m: 360, precipitation_probability: 0, weather_code: 12345,
  },
  current_units: {
    time: 'iso8601', temperature_2m: '°C', relative_humidity_2m: '%',
    apparent_temperature: '°C', is_day: '', wind_speed_10m: 'km/h',
    wind_direction_10m: '°', precipitation_probability: '%', weather_code: 'wmo code',
  },
}
const unavailable = { ok: false, reason: 'unavailable' }
const reply = (data) => new Response(JSON.stringify(data))

test('weather: invalid locations never cause a request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected request') })
  const invalid = [undefined, null, [], {}, '', { ...location, latitude: 91 },
    { ...location, longitude: NaN }, { ...location, timezone: 'invalid' }]
  for (const key of Object.keys(location)) {
    const missing = { ...location }
    delete missing[key]
    invalid.push(missing, { ...location, [key]: null })
  }
  for (const value of invalid) {
    assert.deepEqual(await getCurrentWeather(value), { ok: false, reason: 'invalid-input' })
  }
  assert.equal(fetch.mock.callCount(), 0)
})

test('weather: forecast URL uses the provided location and all PRD variables and units', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => reply(weather))
  for (const value of [location, { ...location, latitude: 0, longitude: 0, timezone: 'Etc/GMT+3' }]) {
    assert.deepEqual(await getCurrentWeather(value), { ok: true, data: weather })
    const [url, options] = fetch.mock.calls.at(-1).arguments
    assert.equal(url.origin, 'https://api.open-meteo.com')
    assert.equal(url.pathname, '/v1/forecast')
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      latitude: String(value.latitude), longitude: String(value.longitude), timezone: value.timezone,
      current: 'precipitation_probability,temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code',
      temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm',
    })
    assert.ok(options.signal instanceof AbortSignal)
  }
  assert.equal(fetch.mock.callCount(), 2)
})

test('weather: preserves original values and associated units without rounding or mutation', async (t) => {
  const original = structuredClone(weather)
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => weather }))
  const result = await getCurrentWeather(location)
  assert.deepEqual(result, { ok: true, data: original })
  assert.deepEqual(weather, original)
})

test('weather: every missing, null or invalid required value and unit causes controlled failure', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  for (const section of ['current', 'current_units']) {
    for (const key of Object.keys(weather[section])) {
      for (const value of [undefined, null, 'invalid']) {
        const payload = structuredClone(weather)
        if (value === undefined) delete payload[section][key]
        else payload[section][key] = value
        fetch.mock.mockImplementation(async () => reply(payload))
        assert.deepEqual(await getCurrentWeather(location), unavailable, `${section}.${key}`)
      }
    }
  }
  for (const payload of [null, [], {}, { current: weather.current }, { current_units: weather.current_units },
    { ...weather, current_units: { ...weather.current_units, temperature_2m: '°F' } },
    { ...weather, current_units: { ...weather.current_units, wind_speed_10m: 'mph' } }]) {
    fetch.mock.mockImplementation(async () => reply(payload))
    assert.deepEqual(await getCurrentWeather(location), unavailable)
  }
})

test('weather: technical failures and provider errors return unavailable without retries', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  const implementations = [
    async () => new Response('error', { status: 429 }),
    async () => new Response('error', { status: 500 }),
    async () => new Response('{invalid'),
    async () => { throw new TypeError('network failure') },
    async () => reply({ ...weather, error: true, reason: 'provider error' }),
  ]
  for (const implementation of implementations) {
    fetch.mock.mockImplementation(implementation)
    assert.deepEqual(await getCurrentWeather(location), unavailable)
  }
  assert.equal(fetch.mock.callCount(), implementations.length)
})

test('weather: pre-cancelled signal prevents a request', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch')
  const controller = new AbortController()
  controller.abort()
  assert.deepEqual(await getCurrentWeather(location, controller.signal), unavailable)
  assert.equal(fetch.mock.callCount(), 0)
})

const waitForAbort = (signal) => new Promise((_, reject) => {
  signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
})

for (const phase of ['fetch', 'body']) {
  for (const cause of ['timeout', 'cancellation']) {
    test(`weather: ${cause} interrupts ${phase} and cleans up`, async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] })
      const controller = new AbortController()
      const remove = t.mock.method(controller.signal, 'removeEventListener')
      let bodyStarted = false
      const fetch = t.mock.method(globalThis, 'fetch', (_, { signal }) => phase === 'fetch'
        ? waitForAbort(signal)
        : Promise.resolve({ ok: true, json: () => { bodyStarted = true; return waitForAbort(signal) } }))
      const pending = getCurrentWeather(location, controller.signal)
      await Promise.resolve()
      if (phase === 'body') assert.equal(bodyStarted, true)
      const signal = fetch.mock.calls[0].arguments[1].signal
      if (cause === 'timeout') {
        t.mock.timers.tick(14_999)
        assert.equal(signal.aborted, false)
        t.mock.timers.tick(1)
      } else controller.abort()
      assert.deepEqual(await pending, unavailable)
      assert.equal(signal.aborted, true)
      assert.equal(fetch.mock.callCount(), 1)
      assert.equal(remove.mock.callCount(), 1)
    })
  }
}

test('weather: success releases timeout and cancellation listener', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const controller = new AbortController()
  const remove = t.mock.method(controller.signal, 'removeEventListener')
  const fetch = t.mock.method(globalThis, 'fetch', async () => reply(weather))
  assert.deepEqual(await getCurrentWeather(location, controller.signal), { ok: true, data: weather })
  controller.abort()
  t.mock.timers.tick(15_000)
  assert.equal(fetch.mock.calls[0].arguments[1].signal.aborted, false)
  assert.equal(remove.mock.callCount(), 1)
})
