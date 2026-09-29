import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { JSDOM, VirtualConsole } from 'jsdom'

// Executes the built application, not source modules. This does not test browser layout or CORS.
const base = new URL('../dist/', import.meta.url)
const html = await readFile(new URL('index.html', base), 'utf8')
const script = html.match(/src="(\/assets\/[^" ]+\.js)"/)[1]
const bundle = await readFile(new URL(script.slice(1), base), 'utf8')
const errors = []
const requests = []
const virtualConsole = new VirtualConsole()
virtualConsole.on('jsdomError', error => errors.push(error.message))
virtualConsole.on('error', (...args) => errors.push(args.join(' ')))
const dom = new JSDOM(html, { url: 'http://localhost:4173/', runScripts: 'outside-only', virtualConsole })
try {
  dom.window.AbortController = AbortController
  dom.window.AbortSignal = AbortSignal
  dom.window.fetch = async (url, options) => {
    const response = await fetch(url, options)
    requests.push({ url: String(url), status: response.status, data: await response.clone().json() })
    return response
  }
  dom.window.addEventListener('error', event => errors.push(event.message))
  dom.window.eval(bundle)
  const document = dom.window.document
  assert.equal(requests.length, 0)
  assert.equal(document.documentElement.lang, 'pt-BR')
  document.querySelector('input').value = 'São Paulo'
  document.querySelector('button[type="submit"]').click()
  assert.equal(document.querySelector('#weather-panel').getAttribute('aria-busy'), 'true')
  const deadline = Date.now() + 35_000
  while (document.querySelector('#weather-panel').getAttribute('aria-busy') === 'true' && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  assert.equal(requests.length, 2, 'Expected geocoding and forecast requests')
  assert.ok(requests.every(request => request.status === 200))
  const location = requests[0].data.results[0]
  const current = requests[1].data.current
  assert.equal(document.querySelector('.weather-city')?.textContent, `${location.name}, ${location.country_code}`)
  const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
  const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
  assert.equal(document.querySelector('.weather-temperature').textContent, `${decimal.format(current.temperature_2m)} °C`)
  assert.deepEqual([...document.querySelectorAll('.metric-value')].map(node => node.textContent), [
    `${integer.format(current.relative_humidity_2m)}%`, `${decimal.format(current.apparent_temperature)} °C`,
    `${integer.format(current.precipitation_probability)}%`, `${decimal.format(current.wind_speed_10m)} km/h`,
  ])
  assert.equal(document.querySelector('#weather-panel').getAttribute('aria-busy'), 'false')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ result: 'passed', environment: 'jsdom + production bundle + live API',
    city: location.name, weatherTime: current.time, temperature: document.querySelector('.weather-temperature').textContent,
    requests: requests.length, errors: errors.length }, null, 2))
} finally {
  dom.window.close()
}
