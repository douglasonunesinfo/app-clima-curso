import { createSearchForm } from './components/searchForm.ts'
import { createWeatherPanel, renderWeatherPanel } from './components/weatherPanel.ts'
import type { WeatherPanelState } from './components/weatherPanel.ts'
import { getCurrentWeather, getLocation } from './services/openMeteo.ts'

export function mountApp(root: HTMLElement): void {
  const main = document.createElement('main')
  const heading = document.createElement('h1')
  heading.textContent = 'Projeto Clima'
  heading.className = 'visually-hidden'
  const panel = createWeatherPanel()
  // Outside aria-busy so loading is announced before the request finishes.
  const status = document.createElement('p')
  status.className = 'visually-hidden'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.setAttribute('aria-atomic', 'true')
  let state: WeatherPanelState = { status: 'idle' }
  let latestSearch = 0

  function update(next: WeatherPanelState): void {
    state = next
    renderWeatherPanel(panel, state)
    status.textContent = state.status === 'success'
      ? `Clima de ${state.location.name}, ${state.location.country_code} carregado.`
      : state.status === 'loading' ? 'Buscando clima…'
      : state.status === 'empty'
        ? 'Não foi possível encontrar informações de clima para essa cidade. Confira o nome e tente novamente'
        : ''
  }

  async function search(city: string): Promise<void> {
    // Only the latest submitted search may render or start its next request.
    // Keep this guard after each await, including failure paths.
    const searchId = ++latestSearch
    update({ status: 'loading' })
    try {
      const location = await getLocation(city)
      if (searchId !== latestSearch) return
      if (location.ok === false) {
        update({ status: 'empty' })
        return
      }

      const weather = await getCurrentWeather(location.data)
      if (searchId !== latestSearch) return
      update(weather.ok === true
        ? { status: 'success', location: location.data, weather: weather.data }
        : { status: 'empty' })
    } catch {
      if (searchId === latestSearch) update({ status: 'empty' })
    }
  }

  const form = createSearchForm((city) => { void search(city) })
  main.append(heading, form, status, panel)
  root.replaceChildren(main)
}
