import type { CurrentWeather, Location } from '../types/weather.ts'
import { formatCurrentDate, formatPercentage, formatTemperature, formatWindDirection, formatWindSpeed } from '../utils/formatters.ts'
import { getDayPeriod, getWeatherDescription } from '../utils/weatherCodes.ts'

export type WeatherPanelState =
  | { status: 'idle' | 'loading' | 'empty' }
  | { status: 'success'; location: Location; weather: CurrentWeather }

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

function iconText(icon: string, text: string): HTMLParagraphElement {
  const paragraph = element('p', 'weather-description')
  const symbol = element('span', 'weather-icon', icon)
  symbol.setAttribute('aria-hidden', 'true')
  paragraph.append(symbol, document.createTextNode(` ${text}`))
  return paragraph
}

function metric(label: string, value: string, detail?: string): HTMLDivElement {
  const card = element('div', 'weather-metric')
  card.append(element('dt', 'metric-label', label), element('dd', 'metric-value', value))
  if (detail) card.append(element('dd', 'metric-detail', detail))
  return card
}

export function renderWeatherPanel(panel: HTMLElement, state: WeatherPanelState, now: Date = new Date()): void {
  const content = document.createDocumentFragment()
  panel.className = 'weather-panel'
  panel.setAttribute('aria-busy', String(state.status === 'loading'))

  if (state.status === 'success') {
    const { location, weather: { current, current_units: units } } = state
    const layout = element('div', 'weather-result')
    const sidebar = element('div', 'weather-sidebar')
    const period = getDayPeriod(current.is_day)
    const condition = getWeatherDescription(current.weather_code)
    sidebar.append(
      element('p', 'weather-temperature', formatTemperature(current.temperature_2m, units.temperature_2m)),
      element('h2', 'weather-city', `${location.name}, ${location.country_code}`),
      element('p', 'weather-date', formatCurrentDate(location.timezone, now)),
      iconText(period.icon, period.label),
      iconText(condition.icon, condition.description),
    )
    const metrics = element('dl', 'weather-metrics')
    metrics.append(
      metric('Umidade relativa', formatPercentage(current.relative_humidity_2m, units.relative_humidity_2m)),
      metric('Sensação térmica', formatTemperature(current.apparent_temperature, units.apparent_temperature)),
      metric('Probabilidade de precipitação', formatPercentage(current.precipitation_probability, units.precipitation_probability)),
      metric('Vento', formatWindSpeed(current.wind_speed_10m, units.wind_speed_10m),
        `Origem: ${formatWindDirection(current.wind_direction_10m, units.wind_direction_10m)}`),
    )
    layout.append(sidebar, metrics)
    content.append(layout)
  } else {
    const empty = element('div', 'empty-state')
    if (state.status === 'loading') {
      const spinner = element('span', 'loading-spinner')
      spinner.setAttribute('aria-hidden', 'true')
      empty.append(spinner)
    }
    const messages = {
      idle: 'Pesquise uma cidade para consultar o clima',
      loading: 'Buscando clima…',
      empty: 'Não foi possível encontrar informações de clima para essa cidade. Confira o nome e tente novamente',
    }
    empty.append(element('p', 'state-message', messages[state.status]))
    content.append(empty)
  }

  const credit = element('p', 'weather-credit', 'Dados meteorológicos: ')
  const link = element('a', '', 'Open-Meteo')
  link.href = 'https://open-meteo.com/'
  credit.append(link)
  content.append(credit)
  panel.replaceChildren(content)
}

export function createWeatherPanel(): HTMLElement {
  const panel = element('section', 'weather-panel')
  panel.id = 'weather-panel'
  panel.setAttribute('aria-label', 'Informações do clima')
  renderWeatherPanel(panel, { status: 'idle' })
  return panel
}
