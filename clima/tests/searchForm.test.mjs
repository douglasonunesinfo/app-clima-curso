import assert from 'node:assert/strict'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { createSearchForm } from '../src/components/searchForm.ts'

function setup(t) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
  const previous = globalThis.document
  globalThis.document = dom.window.document
  t.after(() => { globalThis.document = previous; dom.window.close() })
  const calls = []
  const form = createSearchForm((city) => calls.push(city))
  document.body.append(form)
  return { dom, form, calls, input: form.querySelector('input'), button: form.querySelector('button'), error: form.querySelector('#city-error') }
}

test('search exposes accessible names and does not search on creation or typing', (t) => {
  const { dom, form, input, button, calls } = setup(t)
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('unexpected request') })
  assert.equal(form.getAttribute('role'), 'search')
  assert.equal(form.querySelector('label').htmlFor, input.id)
  assert.equal(form.querySelector('label').textContent, 'Cidade')
  assert.equal(button.getAttribute('aria-label'), 'Buscar clima')
  assert.equal(button.type, 'submit')
  assert.equal(input.value, '')
  input.value = 'São Paulo'
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }))
  assert.deepEqual(calls, [])
  assert.equal(fetch.mock.callCount(), 0)
})

test('blank submission shows the specified error, focuses input and does not search', (t) => {
  const { form, input, button, calls, error } = setup(t)
  for (const value of ['', '   ']) {
    input.value = value
    button.click()
    assert.equal(error.textContent, 'Digite o nome de uma cidade')
    assert.equal(input.getAttribute('aria-invalid'), 'true')
    assert.equal(document.activeElement, input)
    assert.equal(input.getAttribute('aria-describedby'), error.id)
    assert.deepEqual(calls, [])
  }
  assert.equal(form.noValidate, true)
})

test('button activation and form submission share one handler and prevent navigation', (t) => {
  const { dom, form, input, button, calls } = setup(t)
  let prevented = false
  form.addEventListener('submit', (event) => { prevented = event.defaultPrevented })
  input.value = '  São Tomé e Príncipe  '
  button.click()
  assert.equal(prevented, true)
  assert.equal(input.value, 'São Tomé e Príncipe')
  input.value = '  Rio de Janeiro  '
  const event = new dom.window.Event('submit', { bubbles: true, cancelable: true })
  assert.equal(form.dispatchEvent(event), false)
  assert.equal(event.defaultPrevented, true)
  assert.deepEqual(calls, ['São Tomé e Príncipe', 'Rio de Janeiro'])
  assert.equal(dom.window.location.href, 'http://localhost/')
})

test('editing or valid resubmission clears validation feedback', (t) => {
  const { dom, form, input, button, error, calls } = setup(t)
  button.click()
  input.value = 'São Paulo'
  input.dispatchEvent(new dom.window.Event('input'))
  assert.equal(error.textContent, '')
  assert.equal(input.hasAttribute('aria-invalid'), false)
  assert.deepEqual(calls, [])
  input.value = ''
  button.click()
  input.value = ' Porto Alegre '
  form.requestSubmit()
  assert.equal(error.textContent, '')
  assert.equal(input.hasAttribute('aria-invalid'), false)
  assert.deepEqual(calls, ['Porto Alegre'])
})
