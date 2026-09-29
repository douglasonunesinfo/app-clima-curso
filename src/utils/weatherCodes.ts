import type { CurrentConditions } from '../types/weather.ts'

// Decorative symbols must be rendered alongside their accessible descriptions.
export type WeatherDescription = { description: string; icon: string }
export type DayPeriod = { label: 'Dia' | 'Noite'; icon: string }

const conditions = new Map<number, WeatherDescription>([
  [0, { description: 'Céu limpo', icon: '☀️' }],
  [1, { description: 'Predominantemente limpo', icon: '🌤️' }],
  [2, { description: 'Parcialmente nublado', icon: '⛅' }],
  [3, { description: 'Encoberto', icon: '☁️' }],
  [45, { description: 'Nevoeiro', icon: '🌫️' }],
  [48, { description: 'Nevoeiro com formação de geada', icon: '🌫️' }],
  [51, { description: 'Garoa leve', icon: '🌧️' }],
  [53, { description: 'Garoa moderada', icon: '🌧️' }],
  [55, { description: 'Garoa intensa', icon: '🌧️' }],
  [56, { description: 'Garoa congelante leve', icon: '🌧️' }],
  [57, { description: 'Garoa congelante intensa', icon: '🌧️' }],
  [61, { description: 'Chuva leve', icon: '🌧️' }],
  [63, { description: 'Chuva moderada', icon: '🌧️' }],
  [65, { description: 'Chuva forte', icon: '🌧️' }],
  [66, { description: 'Chuva congelante leve', icon: '🌧️' }],
  [67, { description: 'Chuva congelante forte', icon: '🌧️' }],
  [71, { description: 'Neve leve', icon: '🌨️' }],
  [73, { description: 'Neve moderada', icon: '🌨️' }],
  [75, { description: 'Neve forte', icon: '🌨️' }],
  [77, { description: 'Grãos de neve', icon: '🌨️' }],
  [80, { description: 'Pancadas de chuva leves', icon: '🌧️' }],
  [81, { description: 'Pancadas de chuva moderadas', icon: '🌧️' }],
  [82, { description: 'Pancadas de chuva violentas', icon: '🌧️' }],
  [85, { description: 'Pancadas de neve leves', icon: '🌨️' }],
  [86, { description: 'Pancadas de neve fortes', icon: '🌨️' }],
  [95, { description: 'Tempestade', icon: '⛈️' }],
  [96, { description: 'Tempestade com granizo leve', icon: '⛈️' }],
  [97, { description: 'Tempestade forte', icon: '⛈️' }],
  [99, { description: 'Tempestade com granizo forte', icon: '⛈️' }],
])

export function getDayPeriod(isDay: CurrentConditions['is_day']): DayPeriod {
  return isDay === 1 ? { label: 'Dia', icon: '☀️' } : { label: 'Noite', icon: '🌙' }
}

export function getWeatherDescription(code: number): WeatherDescription {
  return { ...(conditions.get(code) ?? { description: 'Condição não identificada', icon: '❔' }) }
}
