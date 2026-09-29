import type { CurrentConditions, CurrentUnits, CurrentWeather, Location } from '../types/weather.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isInRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max
}

export function isTimezone(value: unknown): value is string {
  if (!isNonEmptyString(value) || value !== value.trim() || /^[+-]/.test(value)) return false

  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: value })
    return true
  } catch {
    return false
  }
}

// Validate the API's local ISO timestamp without interpreting it in the device timezone.
export function isLocalDateTime(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
  if (!match) return false

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
    && Number(hourText) <= 23 && Number(minuteText) <= 59
    && (secondText === undefined || Number(secondText) <= 59)
}

export function isLocation(value: unknown): value is Location {
  return isRecord(value)
    && isNonEmptyString(value.name)
    && isNonEmptyString(value.country_code)
    && isInRange(value.latitude, -90, 90)
    && isInRange(value.longitude, -180, 180)
    && isTimezone(value.timezone)
}

export function isCurrentConditions(value: unknown): value is CurrentConditions {
  return isRecord(value)
    && isLocalDateTime(value.time)
    && isFiniteNumber(value.temperature_2m)
    && isInRange(value.relative_humidity_2m, 0, 100)
    && isFiniteNumber(value.apparent_temperature)
    && (value.is_day === 0 || value.is_day === 1)
    && isFiniteNumber(value.wind_speed_10m) && value.wind_speed_10m >= 0
    && isInRange(value.wind_direction_10m, 0, 360)
    && isInRange(value.precipitation_probability, 0, 100)
    && isFiniteNumber(value.weather_code) && Number.isInteger(value.weather_code)
}

export function isCurrentUnits(value: unknown): value is CurrentUnits {
  return isRecord(value)
    && value.time === 'iso8601'
    && value.temperature_2m === '°C'
    && value.relative_humidity_2m === '%'
    && value.apparent_temperature === '°C'
    && value.is_day === ''
    && value.wind_speed_10m === 'km/h'
    && value.wind_direction_10m === '°'
    && value.precipitation_probability === '%'
    && value.weather_code === 'wmo code'
}

export function isCurrentWeather(value: unknown): value is CurrentWeather {
  return isRecord(value)
    && isCurrentConditions(value.current)
    && isCurrentUnits(value.current_units)
}
