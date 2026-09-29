import assert from 'node:assert/strict'
import test from 'node:test'
import { isLocation, isCurrentConditions, isCurrentUnits, isCurrentWeather, isLocalDateTime, isTimezone } from '../src/utils/validators.ts'

const location = { name: 'São Paulo', country_code: 'BR', latitude: -23.55, longitude: -46.63, timezone: 'America/Sao_Paulo' }
const current = {
  time: '2026-09-28T19:15', temperature_2m: 17.1, relative_humidity_2m: 69,
  apparent_temperature: 16.6, is_day: 0, wind_speed_10m: 6.5,
  wind_direction_10m: 124, precipitation_probability: 0, weather_code: 3,
}
const units = {
  time: 'iso8601', temperature_2m: '°C', relative_humidity_2m: '%',
  apparent_temperature: '°C', is_day: '', wind_speed_10m: 'km/h',
  wind_direction_10m: '°', precipitation_probability: '%', weather_code: 'wmo code',
}

test('accepts complete data without changing values or units', () => {
  const payload = { current: { ...current }, current_units: { ...units } }
  const original = structuredClone(payload)
  assert.equal(isLocation(location), true)
  assert.equal(isCurrentWeather(payload), true)
  assert.deepEqual(payload, original)
})

for (const [name, valid, validate] of [
  ['location', location, isLocation], ['conditions', current, isCurrentConditions],
  ['units', units, isCurrentUnits],
]) {
  test(`${name}: rejects non-objects and every missing or null required field`, () => {
    for (const value of [null, undefined, [], '', 0, true]) assert.equal(validate(value), false)
    for (const key of Object.keys(valid)) {
      const incomplete = { ...valid }
      delete incomplete[key]
      assert.equal(validate(incomplete), false, `missing ${key}`)
      for (const value of [null, undefined, {}, []]) {
        assert.equal(validate({ ...valid, [key]: value }), false, `invalid ${key}`)
      }
    }
  })
  test(`${name}: rejects numeric strings, booleans and non-finite numbers`, () => {
    for (const [key, value] of Object.entries(valid)) {
      if (typeof value !== 'number') continue
      for (const invalid of [String(value), true, NaN, Infinity, -Infinity]) {
        assert.equal(validate({ ...valid, [key]: invalid }), false, key)
      }
    }
  })
}

test('accepts zeros, negative temperatures, both day flags and unknown integer codes', () => {
  assert.equal(isLocation({ ...location, latitude: 0, longitude: 0 }), true)
  for (const is_day of [0, 1]) {
    assert.equal(isCurrentConditions({ ...current, temperature_2m: -10, apparent_temperature: -15,
      relative_humidity_2m: 0, wind_speed_10m: 0, wind_direction_10m: 0,
      precipitation_probability: 0, is_day, weather_code: 12345 }), true)
  }
  assert.equal(isCurrentConditions({ ...current, temperature_2m: 0, apparent_temperature: 0 }), true)
})

test('enforces inclusive coordinate and weather boundaries', () => {
  for (const [base, validate, fields] of [
    [location, isLocation, { latitude: [-90, 90], longitude: [-180, 180] }],
    [current, isCurrentConditions, { relative_humidity_2m: [0, 100], precipitation_probability: [0, 100], wind_direction_10m: [0, 360] }],
  ]) {
    for (const [key, [min, max]] of Object.entries(fields)) {
      for (const value of [min, max]) assert.equal(validate({ ...base, [key]: value }), true)
      for (const value of [min - 0.1, max + 0.1]) assert.equal(validate({ ...base, [key]: value }), false)
    }
  }
  for (const [key, value] of [['wind_speed_10m', -1], ['is_day', 2], ['is_day', -1], ['is_day', 0.5], ['weather_code', 1.5]]) {
    assert.equal(isCurrentConditions({ ...current, [key]: value }), false)
  }
})

test('rejects blank location text and invalid timezone identifiers', () => {
  for (const key of ['name', 'country_code']) {
    for (const value of ['', '   ', 42, false]) assert.equal(isLocation({ ...location, [key]: value }), false)
  }
  for (const value of ['America/Sao_Paulo', 'UTC', 'Asia/Tokyo']) assert.equal(isTimezone(value), true)
  for (const value of ['', ' ', 'Mars/Olympus', '+03:00', ' UTC ', null, 42]) {
    assert.equal(isTimezone(value), false)
    assert.equal(isLocation({ ...location, timezone: value }), false)
  }
})

test('validates actual calendar dates and clock limits without timezone conversion', () => {
  for (const value of ['2024-02-29T00:00', '2000-02-29T23:59:59', '2026-12-31T23:59']) {
    assert.equal(isLocalDateTime(value), true, value)
  }
  for (const value of ['2026-02-29T00:00', '1900-02-29T00:00', '2026-04-31T12:00',
    '2026-00-01T00:00', '2026-13-01T00:00', '2026-01-00T00:00', '0000-01-01T00:00',
    '2026-01-01T24:00', '2026-01-01T00:60', '2026-01-01T00:00:60', '2026-01-01',
    'invalid', '', null, 42]) {
    assert.equal(isLocalDateTime(value), false, String(value))
    assert.equal(isCurrentConditions({ ...current, time: value }), false)
  }
})

test('requires matching metric units and both validated weather sections', () => {
  for (const [key, value] of [['temperature_2m', '°F'], ['wind_speed_10m', 'mph'], ['is_day', '1'], ['time', 'unixtime']]) {
    assert.equal(isCurrentWeather({ current, current_units: { ...units, [key]: value } }), false)
  }
  for (const value of [null, [], {}, { current }, { current_units: units },
    { current: null, current_units: units }, { current, current_units: null }]) {
    assert.equal(isCurrentWeather(value), false)
  }
  assert.equal(isCurrentWeather({ current: { ...current, interval: 900 }, current_units: units, elevation: 38 }), true)
})
