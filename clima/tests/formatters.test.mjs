import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { formatTemperature, formatWindSpeed, formatPercentage, getWindDirection, formatWindDirection, formatCurrentDate } from '../src/utils/formatters.ts'
import { getDayPeriod, getWeatherDescription } from '../src/utils/weatherCodes.ts'

test('every PRD weather code has its Portuguese description and an icon', () => {
  const expected = {
    0: 'Céu limpo', 1: 'Predominantemente limpo', 2: 'Parcialmente nublado', 3: 'Encoberto',
    45: 'Nevoeiro', 48: 'Nevoeiro com formação de geada',
    51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa intensa',
    56: 'Garoa congelante leve', 57: 'Garoa congelante intensa',
    61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
    66: 'Chuva congelante leve', 67: 'Chuva congelante forte',
    71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte', 77: 'Grãos de neve',
    80: 'Pancadas de chuva leves', 81: 'Pancadas de chuva moderadas', 82: 'Pancadas de chuva violentas',
    85: 'Pancadas de neve leves', 86: 'Pancadas de neve fortes',
    95: 'Tempestade', 96: 'Tempestade com granizo leve', 97: 'Tempestade forte', 99: 'Tempestade com granizo forte',
  }
  for (const [code, description] of Object.entries(expected)) {
    const actual = getWeatherDescription(Number(code))
    assert.equal(actual.description, description)
    assert.ok(actual.icon.length > 0)
  }
})

test('unknown codes have fallback and callers cannot mutate the mapping', () => {
  for (const code of [-1, 4, 12345]) {
    assert.equal(getWeatherDescription(code).description, 'Condição não identificada')
    assert.ok(getWeatherDescription(code).icon)
  }
  getWeatherDescription(0).description = 'changed'
  assert.equal(getWeatherDescription(0).description, 'Céu limpo')
})

test('day and night depend only on is_day and have distinct icons', () => {
  assert.equal(getDayPeriod(1).label, 'Dia')
  assert.equal(getDayPeriod(0).label, 'Noite')
  assert.notEqual(getDayPeriod(1).icon, getDayPeriod(0).icon)
})

test('temperatures and speed use pt-BR and at most one decimal', () => {
  assert.equal(formatTemperature(17.16, '°C'), '17,2 °C')
  assert.equal(formatTemperature(-2.35, '°C'), '-2,4 °C')
  assert.equal(formatTemperature(0, '°C'), '0 °C')
  assert.equal(formatTemperature(20, '°C'), '20 °C')
  assert.equal(formatWindSpeed(6.55, 'km/h'), '6,6 km/h')
  assert.equal(formatWindSpeed(0, 'km/h'), '0 km/h')
  assert.equal(formatWindSpeed(1234.5, 'km/h'), '1.234,5 km/h')
})

test('percentages round without decimals or multiplying API percentages by 100', () => {
  for (const [value, expected] of [[0, '0%'], [69.4, '69%'], [69.5, '70%'], [100, '100%']]) {
    assert.equal(formatPercentage(value, '%'), expected)
  }
})

test('wind origin covers all eight sectors, boundaries and north wraparound', () => {
  for (const [degrees, direction] of [[0, 'N'], [45, 'NE'], [90, 'L'], [135, 'SE'],
    [180, 'S'], [225, 'SO'], [270, 'O'], [315, 'NO'], [360, 'N'], [124, 'SE']]) {
    assert.equal(getWindDirection(degrees), direction)
  }
  const sectors = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO', 'N']
  for (let i = 0; i < 8; i++) {
    const boundary = 22.5 + i * 45
    assert.equal(getWindDirection(boundary - 0.01), sectors[i])
    assert.equal(getWindDirection(boundary), sectors[i + 1])
    assert.equal(getWindDirection(boundary + 0.01), sectors[i + 1])
  }
  assert.equal(formatWindDirection(124, '°'), '124° (SE)')
  assert.equal(formatWindDirection(360, '°'), '360° (N)')
  assert.equal(formatWindDirection(22.5, '°'), '22,5° (NE)')
})

test('city date uses the supplied instant and timezone near midnight and year boundary', () => {
  const instant = new Date('2026-01-01T00:30:00Z')
  assert.equal(formatCurrentDate('America/Sao_Paulo', instant), 'quarta-feira, 31/12/2025')
  assert.equal(formatCurrentDate('Asia/Tokyo', instant), 'quinta-feira, 01/01/2026')
  assert.equal(instant.toISOString(), '2026-01-01T00:30:00.000Z')
})

test('default date uses current clock, not the weather timestamp', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-01-01T00:30:00Z') })
  assert.equal(formatCurrentDate('America/Sao_Paulo'), 'quarta-feira, 31/12/2025')
})

test('city date is independent of device timezone in separate processes', () => {
  const moduleUrl = new URL('../src/utils/formatters.ts', import.meta.url).href
  const script = `import { formatCurrentDate } from ${JSON.stringify(moduleUrl)};
    console.log(formatCurrentDate('America/Sao_Paulo', new Date('2026-01-01T00:30:00Z')));`
  for (const tz of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
    const actual = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, TZ: tz }, encoding: 'utf8',
    })
    assert.equal(actual.trim(), 'quarta-feira, 31/12/2025')
  }
})
