import type { CurrentUnits } from '../types/weather.ts'

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'] as const

export type WindDirection = typeof directions[number]

// These helpers consume the validated domain data, keeping presentation separate.
export function formatTemperature(value: number, unit: CurrentUnits['temperature_2m']): string {
  return `${decimal.format(value)} ${unit}`
}

export function formatWindSpeed(value: number, unit: CurrentUnits['wind_speed_10m']): string {
  return `${decimal.format(value)} ${unit}`
}

export function formatPercentage(value: number, unit: CurrentUnits['relative_humidity_2m']): string {
  return `${integer.format(value)}${unit}`
}

export function getWindDirection(degrees: number): WindDirection {
  // Sectors are centered on each cardinal point; a boundary belongs to the next sector.
  return directions[Math.floor((degrees + 22.5) / 45) % directions.length]
}

export function formatWindDirection(degrees: number, unit: CurrentUnits['wind_direction_10m']): string {
  return `${decimal.format(degrees)}${unit} (${getWindDirection(degrees)})`
}

export function formatCurrentDate(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(now)
}
