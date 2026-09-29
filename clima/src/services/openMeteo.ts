import type { CurrentWeather, Location, Result } from '../types/weather.ts'
import { isCurrentWeather, isLocation } from '../utils/validators.ts'

const REQUEST_TIMEOUT_MS = 15_000
const CURRENT_VARIABLES = [
  'precipitation_probability', 'temperature_2m', 'relative_humidity_2m',
  'apparent_temperature', 'is_day', 'wind_speed_10m', 'wind_direction_10m',
  'wind_gusts_10m', 'precipitation', 'weather_code',
].join(',')

// Shared transport for the provider's endpoints. The timeout includes JSON reading.
async function requestJson(url: URL, signal?: AbortSignal): Promise<Result<unknown>> {
  if (signal?.aborted) return { ok: false, reason: 'unavailable' }

  const controller = new AbortController()
  const cancel = () => controller.abort()
  signal?.addEventListener('abort', cancel, { once: true })
  const timeout = setTimeout(cancel, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return { ok: false, reason: 'unavailable' }

    const data: unknown = await response.json()
    if (controller.signal.aborted || (
      typeof data === 'object' && data !== null && 'error' in data && data.error === true
    )) return { ok: false, reason: 'unavailable' }

    return { ok: true, data }
  } catch {
    return { ok: false, reason: 'unavailable' }
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', cancel)
  }
}

export async function getLocation(city: string, signal?: AbortSignal): Promise<Result<Location>> {
  if (typeof city !== 'string' || city.trim().length === 0) {
    return { ok: false, reason: 'invalid-input' }
  }

  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.search = new URLSearchParams({
    name: city.trim(), count: '1', language: 'pt', format: 'json',
  }).toString()

  const result = await requestJson(url, signal)
  if (result.ok === false) return result

  const data = result.data
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, reason: 'unavailable' }
  }
  if (!('results' in data)) return { ok: false, reason: 'not-found' }
  if (!Array.isArray(data.results)) return { ok: false, reason: 'unavailable' }
  if (data.results.length === 0) return { ok: false, reason: 'not-found' }

  const location = data.results.find(isLocation)
  return location
    ? { ok: true, data: location }
    : { ok: false, reason: 'unavailable' }
}

export async function getCurrentWeather(
  location: Location,
  signal?: AbortSignal,
): Promise<Result<CurrentWeather>> {
  if (!isLocation(location)) return { ok: false, reason: 'invalid-input' }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: CURRENT_VARIABLES,
    timezone: location.timezone,
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  }).toString()

  const result = await requestJson(url, signal)
  if (result.ok === false) return result

  return isCurrentWeather(result.data)
    ? { ok: true, data: result.data }
    : { ok: false, reason: 'unavailable' }
}
