export type Location = {
  name: string
  country_code: string
  latitude: number
  longitude: number
  timezone: string
}

export type CurrentConditions = {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  apparent_temperature: number
  is_day: 0 | 1
  wind_speed_10m: number
  wind_direction_10m: number
  precipitation_probability: number
  weather_code: number
}

export type CurrentUnits = {
  time: 'iso8601'
  temperature_2m: '°C'
  relative_humidity_2m: '%'
  apparent_temperature: '°C'
  is_day: ''
  wind_speed_10m: 'km/h'
  wind_direction_10m: '°'
  precipitation_probability: '%'
  weather_code: 'wmo code'
}

export type CurrentWeather = {
  current: CurrentConditions
  current_units: CurrentUnits
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'invalid-input' | 'not-found' | 'unavailable' }
