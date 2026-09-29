# Validação do MVP — T11

Referências: [PRD, §8](./prd.md#8-critérios-de-aceite) e [tarefas](./tasks.md). Verificação em 28/09/2026.

## Evidências executadas

- Verificação adicional: `npm run verify:production` executou o bundle de `dist/` em jsdom, submeteu a busca pela lupa e completou duas chamadas reais. São Paulo, temperatura de 19,9 °C e os quatro indicadores renderizados corresponderam à resposta (referência `2026-09-28T22:00`), sem erros capturados. Isso não comprova layout, CORS, teclado físico ou leitor de tela. O script usa AbortController do Node.js para compatibilidade com seu fetch.

- `npm test`: 80 testes aprovados, nenhuma falha ou rejeição não tratada reportada.
- `npm run build`: TypeScript e Vite aprovados; gerado `dist/` com HTML, CSS, JavaScript e favicon.
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`: servidor iniciado. HTML e ambos os assets referenciados responderam HTTP 200.
- Consulta real usando `getLocation('São Paulo')` e `getCurrentWeather(location.data)`: ambos retornaram sucesso. A primeira tentativa foi impedida pela rede restrita; a execução com acesso autorizado à rede passou.
- Geocodificação real: latitude -23.5475, longitude -46.63611, timezone `America/Sao_Paulo`.
- Resposta de clima com referência `2026-09-28T21:45`: temperatura 19,9 °C, umidade 87%, sensação 21,3 °C, probabilidade de precipitação 2%, vento 9,3 km/h de 119°, `is_day=0` e `weather_code=3`. Valores validados pelos contratos do projeto. Esta consulta foi executada no Node.js; não comprova CORS ou exibição no navegador.
- Inspeção dos fontes: chamadas `fetch` restritas a `src/services/openMeteo.ts`; sem uso de localStorage, sessionStorage ou IndexedDB; sem backend próprio, funcionalidades fora do MVP ou declarações `interface`.
- Inventário de automação retornou apps e navegadores vazios. Não foi possível verificar console, aparência, teclado ou leitor de tela em navegador real.

## Matriz dos 16 critérios do PRD

“Aprovado em testes” indica validação automatizada com DOM/respostas controladas, não inspeção em navegador.

| Critério | Resultado | Evidência |
| --- | --- | --- |
| 1 — Estado inicial sem chamadas | Aprovado em testes | `app.test.mjs` e `weatherPanel.test.mjs`: montagem inicial sem requisição. |
| 2 — Entrada vazia | Aprovado em testes | `searchForm.test.mjs` e `app.test.mjs`: vazios/espaços não disparam chamadas. |
| 3 — Geocodificação seguida de clima | Aprovado em testes e serviços reais | `app.test.mjs` verifica sequência e parâmetros; consulta real das duas funções passou. |
| 4 — Loading único | Aprovado em testes | Mesmo indicador entre as duas chamadas, sem resultado intermediário. |
| 5 — Campos e unidades | Aprovado em testes | `weatherPanel.test.mjs` verifica sidebar, quatro indicadores e textos; inspeção visual pendente. |
| 6 — Zeros e temperaturas negativas | Aprovado em testes | Validadores, serviços e formatadores cobrem valores limites e zero. |
| 7 — Cidade ausente | Aprovado em testes | Geocodificação sem resultado impede forecast. |
| 8 — Clima inválido/ausente | Aprovado em testes | Serviço e aplicação retornam estado sem resultado. |
| 9 — Falhas e recuperação | Aprovado em testes | HTTP, JSON, rede e timeout nas duas etapas; nova busca funciona. |
| 10 — Substituição e concorrência | Aprovado em testes | Respostas/falhas antigas não alteram busca mais recente. |
| 11 — Dia/noite e data local | Aprovado em testes | Formatadores usam fuso da cidade, com processos em três fusos distintos. |
| 12 — Códigos conhecidos/desconhecidos | Aprovado em testes | Os 29 códigos do PRD e fallback verificados. |
| 13 — Layout e ausência de overflow | Pendente | CSS implementado; falta inspeção em 320, 375, 640 e 1024 px. |
| 14 — Teclado e tecnologia assistiva | Parcial | Semântica, mensagens e contraste verificados; falta teclado e leitor de tela reais. |
| 15 — Build | Aprovado | `npm run build` concluído com sucesso. |
| 16 — Enter, lupa e digitação | Parcial | Clique/submit e ausência de busca na digitação testados em DOM; Enter e ativação por teclado reais pendentes. |

## Pendências para aprovação final

1. Abrir o preview em navegador real, buscar São Paulo e comparar o painel às respostas da rede; confirmar ausência de erros no console.
2. Conferir os quatro estados em 320, 375, 640 e 1024 px, incluindo nomes/descrições longos, sem cortes ou rolagem horizontal.
3. Operar a busca com Tab, Shift+Tab, Enter e ativação da lupa pelo teclado, verificando foco visível.
4. Ouvir loading, resultado e ausência com leitor de tela e conferir movimento reduzido.

T11 permanece sem aprovação final. Os itens pendentes também impedem encerrar as verificações visuais de T01/T06/T07/T10. Comandos de execução e publicação estática estão no [README](../README.md).
