import './style.css'
import { mountApp } from './app.ts'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Elemento raiz da aplicação não encontrado.')
}

mountApp(app)
