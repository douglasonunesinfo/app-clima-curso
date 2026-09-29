export type SearchHandler = (city: string) => void

export function createSearchForm(onSearch: SearchHandler): HTMLFormElement {
  const form = document.createElement('form')
  form.className = 'city-search'
  form.setAttribute('role', 'search')
  form.noValidate = true
  form.innerHTML = `
    <label class="visually-hidden" for="city">Cidade</label>
    <div class="search-control">
      <input id="city" name="city" type="search" placeholder="Digite o nome da cidade"
        autocomplete="off" enterkeyhint="search" required aria-describedby="city-error" />
      <button type="submit" aria-label="Buscar clima">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
          stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      </button>
    </div>
    <p id="city-error" class="search-error" aria-live="polite"></p>
  `

  const input = form.querySelector<HTMLInputElement>('input')!
  const error = form.querySelector<HTMLParagraphElement>('#city-error')!

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const city = input.value.trim()
    input.value = city

    if (!city) {
      error.textContent = 'Digite o nome de uma cidade'
      input.setAttribute('aria-invalid', 'true')
      input.focus()
      return
    }

    error.textContent = ''
    input.removeAttribute('aria-invalid')
    onSearch(city)
  })

  input.addEventListener('input', () => {
    error.textContent = ''
    input.removeAttribute('aria-invalid')
  })

  return form
}
