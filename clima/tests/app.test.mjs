import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { mountApp } from '../src/app.ts'

const location = { name: 'São Paulo', country_code: 'BR', latitude: -23.55, longitude: -46.63, timezone: 'America/Sao_Paulo' }
const weather = {
  current: { time: '2026-01-01T00:00', temperature_2m: 20, relative_humidity_2m: 69,
    apparent_temperature: 19, is_day: 0, wind_speed_10m: 6.5,
    wind_direction_10m: 124, precipitation_probability: 0, weather_code: 3 },
  current_units: { time: 'iso8601', temperature_2m: '°C', relative_humidity_2m: '%',
    apparent_temperature: '°C', is_day: '', wind_speed_10m: 'km/h', wind_direction_10m: '°',
    precipitation_probability: '%', weather_code: 'wmo code' },
}
const reply = data => new Response(JSON.stringify(data))
const flush = () => new Promise(resolve => setImmediate(resolve))

function setup(t) {
  const dom = new JSDOM('<!doctype html><div id="app"></div>', { url: 'http://localhost/' })
  const previous = globalThis.document
  globalThis.document = dom.window.document
  t.after(() => { globalThis.document = previous; dom.window.close() })
  const requests = []
  t.mock.method(globalThis, 'fetch', (url, { signal }) => new Promise((resolve, reject) => {
    requests.push({ url, resolve, reject, signal })
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }))
  mountApp(document.querySelector('#app'))
  const form = document.querySelector('form')
  const input = form.querySelector('input')
  const panel = document.querySelector('#weather-panel')
  const submit = (city, click = false) => {
    input.value = city
    if (click) form.querySelector('button').click()
    else form.requestSubmit()
  }
  return { dom, requests, form, input, panel, submit }
}

test('app starts idle; typing and blank submission never request data', (t) => {
  const { dom, requests, input, panel, submit } = setup(t)
  assert.match(panel.textContent, /Pesquise uma cidade para consultar o clima/)
  input.value = 'São Paulo'
  input.dispatchEvent(new dom.window.Event('input'))
  submit('   ')
  assert.equal(requests.length, 0)
  assert.equal(panel.getAttribute('aria-busy'), 'false')
  assert.equal(document.querySelector('#city-error').textContent, 'Digite o nome de uma cidade')
})

test('app keeps one loading across sequential requests and commits a complete result', async (t) => {
  const { dom, requests, input, panel, submit } = setup(t)
  submit('  São Paulo  ', true)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].url.searchParams.get('name'), 'São Paulo')
  assert.equal(panel.getAttribute('aria-busy'), 'true')
  const status = document.querySelector('[role="status"]')
  assert.equal(status.textContent, 'Buscando clima…')
  assert.equal(status.getAttribute('aria-live'), 'polite')
  assert.equal(status.closest('[aria-busy]'), null)
  const spinner = panel.querySelector('.loading-spinner')
  requests[0].resolve(reply({ results: [location] }))
  await flush()
  assert.equal(requests.length, 2)
  assert.equal(requests[1].url.origin, 'https://api.open-meteo.com')
  assert.equal(requests[1].url.searchParams.get('latitude'), String(location.latitude))
  assert.equal(requests[1].url.searchParams.get('longitude'), String(location.longitude))
  assert.equal(requests[1].url.searchParams.get('timezone'), location.timezone)
  assert.equal(panel.querySelector('.loading-spinner'), spinner)
  assert.equal(panel.querySelector('.weather-city'), null)
  requests[1].resolve(reply(weather))
  await flush()
  assert.equal(panel.getAttribute('aria-busy'), 'false')
  assert.equal(panel.querySelector('.weather-city').textContent, 'São Paulo, BR')
  assert.equal(panel.querySelectorAll('.weather-metric').length, 4)
  assert.equal(panel.querySelector('.loading-spinner'), null)
  assert.equal(input.value, 'São Paulo')
  assert.equal(status.textContent, 'Clima de São Paulo, BR carregado.')
  assert.equal(dom.window.location.href, 'http://localhost/')
})

for (const invalid of [{ results: [] }, {}, { results: [{ ...location, timezone: 'invalid' }] }]) {
  test(`app stops before forecast for invalid geocoding: ${JSON.stringify(invalid)}`, async (t) => {
    const { requests, panel, input, submit } = setup(t)
    submit('Cidade')
    requests[0].resolve(reply(invalid))
    await flush()
    assert.equal(requests.length, 1)
    assert.match(panel.textContent, /Não foi possível encontrar informações de clima/)
    assert.equal(panel.getAttribute('aria-busy'), 'false')
    assert.equal(input.value, 'Cidade')
  })
}

test('app treats invalid weather as empty and permits retry and replacement', async (t) => {
  const { requests, panel, input, submit } = setup(t)
  submit('São Paulo')
  requests[0].resolve(reply({ results: [location] }))
  await flush()
  requests[1].resolve(reply({ current: {} }))
  await flush()
  assert.match(panel.textContent, /Não foi possível encontrar informações de clima/)
  assert.equal(input.value, 'São Paulo')
  submit('São Paulo')
  requests[2].resolve(reply({ results: [location] }))
  await flush()
  requests[3].resolve(reply(weather))
  await flush()
  assert.ok(panel.querySelector('.weather-city'))
  submit('Rio de Janeiro')
  assert.equal(panel.querySelector('.weather-city'), null)
  assert.match(panel.textContent, /Buscando clima…/)
  requests[4].resolve(reply({ results: [{ ...location, name: 'Rio de Janeiro' }] }))
  await flush()
  requests[5].resolve(reply(weather))
  await flush()
  assert.equal(panel.querySelector('.weather-city').textContent, 'Rio de Janeiro, BR')
  assert.equal(input.value, 'Rio de Janeiro')
})

async function assertRecovery(context) {
  const { requests, panel, input, submit } = context
  const start = requests.length
  submit('Recuperação')
  requests[start].resolve(reply({ results: [{ ...location, name: 'Recuperação' }] }))
  await flush()
  requests[start + 1].resolve(reply(weather))
  await flush()
  assert.equal(panel.querySelector('.weather-city').textContent, 'Recuperação, BR')
  assert.equal(panel.getAttribute('aria-busy'), 'false')
  assert.equal(input.value, 'Recuperação')
  assert.equal(requests.length, start + 2)
}

for (const phase of ['geocoding', 'forecast']) {
  for (const failure of ['HTTP', 'JSON', 'network', 'timeout']) {
    test(`app recovers from ${failure} in ${phase} without retry`, async (t) => {
      t.mock.timers.enable({ apis: ['setTimeout'] })
      const context = setup(t)
      const { requests, panel, input, submit } = context
      submit('Cidade')
      if (phase === 'forecast') {
        requests[0].resolve(reply({ results: [location] }))
        await flush()
      }
      const pending = requests.at(-1)
      const expectedCalls = phase === 'forecast' ? 2 : 1
      if (failure === 'HTTP') pending.resolve(new Response('error', { status: 500 }))
      if (failure === 'JSON') pending.resolve(new Response('{invalid'))
      if (failure === 'network') pending.reject(new TypeError('Network failure'))
      if (failure === 'timeout') {
        t.mock.timers.tick(14_999)
        assert.equal(panel.getAttribute('aria-busy'), 'true')
        t.mock.timers.tick(1)
        assert.equal(pending.signal.aborted, true)
      }
      await flush()
      assert.equal(panel.getAttribute('aria-busy'), 'false')
      assert.equal(panel.querySelector('.loading-spinner'), null)
      assert.match(panel.textContent, /Não foi possível encontrar informações de clima/)
      assert.match(document.querySelector('[role="status"]').textContent, /Não foi possível encontrar informações de clima/)
      assert.equal(input.value, 'Cidade')
      t.mock.timers.tick(60_000)
      await flush()
      assert.equal(requests.length, expectedCalls)
      await assertRecovery(context)
    })
  }
}

for (const phase of ['geocoding', 'forecast']) {
  for (const lateOutcome of ['success', 'failure']) {
    for (const newerState of ['loading', 'success', 'empty']) {
      test(`stale ${phase} ${lateOutcome} cannot change newer ${newerState}`, async (t) => {
        const context = setup(t)
        const { requests, panel, input, submit } = context
        submit('Cidade A')
        if (phase === 'forecast') {
          requests[0].resolve(reply({ results: [{ ...location, name: 'Cidade A' }] }))
          await flush()
        }
        const oldRequest = requests.at(-1)
        submit('Cidade B')
        const newerGeo = requests.at(-1)
        if (newerState === 'success') {
          newerGeo.resolve(reply({ results: [{ ...location, name: 'Cidade B' }] }))
          await flush()
          requests.at(-1).resolve(reply(weather))
          await flush()
        } else if (newerState === 'empty') {
          newerGeo.resolve(reply({ results: [] }))
          await flush()
        }
        const before = panel.innerHTML
        const busy = panel.getAttribute('aria-busy')
        const calls = requests.length
        if (lateOutcome === 'failure') oldRequest.reject(new TypeError('Late failure'))
        else oldRequest.resolve(reply(phase === 'geocoding'
          ? { results: [{ ...location, name: 'Cidade A' }] } : weather))
        await flush()
        assert.equal(panel.innerHTML, before)
        assert.equal(panel.getAttribute('aria-busy'), busy)
        assert.equal(input.value, 'Cidade B')
        assert.equal(requests.length, calls)
        if (newerState === 'loading') {
          assert.equal(busy, 'true')
          newerGeo.resolve(reply({ results: [{ ...location, name: 'Cidade B' }] }))
          await flush()
          requests.at(-1).resolve(reply(weather))
          await flush()
          assert.equal(panel.querySelector('.weather-city').textContent, 'Cidade B, BR')
        }
        await assertRecovery(context)
      })
    }
  }
}

test('an old forecast failure cannot stop the newer forecast loading', async (t) => {
  const context = setup(t)
  const { requests, panel, submit } = context
  submit('Cidade A')
  requests[0].resolve(reply({ results: [location] }))
  await flush()
  const oldForecast = requests[1]
  submit('Cidade B')
  requests[2].resolve(reply({ results: [{ ...location, name: 'Cidade B' }] }))
  await flush()
  const spinner = panel.querySelector('.loading-spinner')
  oldForecast.reject(new TypeError('Late error'))
  await flush()
  assert.equal(panel.getAttribute('aria-busy'), 'true')
  assert.equal(panel.querySelector('.loading-spinner'), spinner)
  requests[3].resolve(reply(weather))
  await flush()
  assert.equal(panel.querySelector('.weather-city').textContent, 'Cidade B, BR')
  assert.equal(requests.length, 4)
  await assertRecovery(context)
})
