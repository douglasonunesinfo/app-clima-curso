import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { createWeatherPanel, renderWeatherPanel } from '../src/components/weatherPanel.ts'

const location = { name: 'São Paulo', country_code: 'BR', latitude: -23.55, longitude: -46.63, timezone: 'America/Sao_Paulo' }
const weather = {
  current: { time: '2026-01-01T00:00', temperature_2m: -2.35, relative_humidity_2m: 69,
    apparent_temperature: -5.12, is_day: 0, wind_speed_10m: 6.5,
    wind_direction_10m: 124, precipitation_probability: 0, weather_code: 3 },
  current_units: { time: 'iso8601', temperature_2m: '°C', relative_humidity_2m: '%',
    apparent_temperature: '°C', is_day: '', wind_speed_10m: 'km/h', wind_direction_10m: '°',
    precipitation_probability: '%', weather_code: 'wmo code' },
}
const now = new Date('2026-01-01T00:30:00Z')
const success = { status: 'success', location, weather }

function setup(t) {
  const dom = new JSDOM('<!doctype html><body></body>')
  const previous = globalThis.document
  globalThis.document = dom.window.document
  t.after(() => { globalThis.document = previous; dom.window.close() })
  const panel = createWeatherPanel()
  document.body.append(panel)
  return panel
}

test('panel starts empty with required message, credit and no requests', (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected request') })
  const panel = setup(t)
  assert.equal(panel.querySelector('.state-message').textContent, 'Pesquise uma cidade para consultar o clima')
  assert.equal(panel.querySelectorAll('.weather-metric').length, 0)
  assert.equal(panel.querySelector('a').href, 'https://open-meteo.com/')
  assert.equal(panel.getAttribute('aria-label'), 'Informações do clima')
  assert.equal(panel.getAttribute('aria-busy'), 'false')
  assert.equal(fetch.mock.callCount(), 0)
})

test('success renders sidebar and exactly four labeled metrics with formatted units', (t) => {
  const panel = setup(t)
  const original = structuredClone(success)
  renderWeatherPanel(panel, success, now)
  assert.equal(panel.querySelector('.weather-temperature').textContent, '-2,4 °C')
  assert.equal(panel.querySelector('.weather-city').textContent, 'São Paulo, BR')
  assert.equal(panel.querySelector('.weather-date').textContent, 'quarta-feira, 31/12/2025')
  assert.match(panel.textContent, /Noite/)
  assert.match(panel.textContent, /Encoberto/)
  assert.deepEqual([...panel.querySelectorAll('dt')].map(node => node.textContent),
    ['Umidade relativa', 'Sensação térmica', 'Probabilidade de precipitação', 'Vento'])
  assert.deepEqual([...panel.querySelectorAll('.metric-value')].map(node => node.textContent),
    ['69%', '-5,1 °C', '0%', '6,5 km/h'])
  assert.equal(panel.querySelector('.metric-detail').textContent, 'Origem: 124° (SE)')
  assert.equal(panel.querySelector('.state-message'), null)
  assert.equal(panel.querySelectorAll('.weather-result > *').length, 2)
  assert.equal(panel.querySelectorAll('.weather-icon[aria-hidden="true"]').length, 2)
  assert.deepEqual(success, original)
})

test('state transitions replace previous content and update loading semantics', (t) => {
  const panel = setup(t)
  renderWeatherPanel(panel, success, now)
  renderWeatherPanel(panel, { status: 'loading' })
  assert.equal(panel.querySelector('.state-message').textContent, 'Buscando clima…')
  assert.equal(panel.getAttribute('aria-busy'), 'true')
  assert.ok(panel.querySelector('.loading-spinner'))
  assert.equal(panel.querySelector('.weather-result'), null)
  renderWeatherPanel(panel, { status: 'empty' })
  assert.equal(panel.querySelector('.state-message').textContent,
    'Não foi possível encontrar informações de clima para essa cidade. Confira o nome e tente novamente')
  assert.equal(panel.getAttribute('aria-busy'), 'false')
  assert.equal(panel.querySelector('.loading-spinner'), null)
  renderWeatherPanel(panel, success, now)
  assert.equal(panel.querySelector('.empty-state'), null)
  assert.equal(panel.querySelectorAll('.weather-credit').length, 1)
  renderWeatherPanel(panel, { status: 'idle' })
  assert.equal(panel.querySelector('.weather-result'), null)
})

test('city markup is rendered as literal text without creating elements or handlers', (t) => {
  const panel = setup(t)
  const name = '<img src=x onerror="alert(1)"><script>alert(1)</script>'
  renderWeatherPanel(panel, { ...success, location: { ...location, name } }, now)
  assert.equal(panel.querySelector('.weather-city').textContent, `${name}, BR`)
  assert.equal(panel.querySelector('img, script, [onerror]'), null)
})

test('day and unknown weather codes retain readable labels and valid metrics', (t) => {
  const panel = setup(t)
  renderWeatherPanel(panel, { ...success, weather: { ...weather,
    current: { ...weather.current, is_day: 1, weather_code: 12345 } } }, now)
  assert.match(panel.textContent, /Dia/)
  assert.match(panel.textContent, /Condição não identificada/)
  assert.equal(panel.querySelectorAll('.weather-metric').length, 4)
})
