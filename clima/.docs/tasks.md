# Tarefas de implementação — Projeto Clima

Fonte de verdade: [PRD](./prd.md). Este arquivo define a sequência de execução e a aprovação das entregas; campos, mensagens, endpoints e especificações visuais permanecem no PRD.

## Como executar

- Executar uma tarefa por vez, na ordem abaixo. Cada tarefa depende das anteriores concluídas.
- Antes de alterar código, ler as referências indicadas, as orientações do repositório e a implementação existente. Reaproveitar o trabalho anterior.
- Manter o projeto compilável a cada entrega. Não antecipar funcionalidades de tarefas seguintes nem ampliar o escopo do MVP.
- Declarar tipos e contratos TypeScript com `type`, nunca com `interface`, conforme a convenção do [PRD, §5](./prd.md#5-integração-e-arquitetura-técnica).
- Marcar `[x]` somente depois de implementar e verificar todos os critérios da tarefa. Se uma verificação estiver bloqueada, manter `[ ]` e registrar o motivo.
- Ao concluir, acrescentar abaixo da tarefa um registro curto com arquivos alterados, verificações executadas e respectivos resultados. Registrar também decisões técnicas relevantes para o próximo agente.
- Usar testes automatizados para regras de dados, integração e concorrência quando apropriado; verificar layout e interação no navegador. Dados simulados pertencem apenas à validação, nunca à experiência normal do produto.
- Se surgir uma decisão de produto sem resposta clara no PRD, perguntar ao usuário antes de defini-la.

## Sequência de tarefas

- [ ] **T01 — Preparar a base do aplicativo**

  **Referências:** PRD, [§2 — Escopo](./prd.md#2-escopo-funcional), [§5 — Arquitetura](./prd.md#5-integração-e-arquitetura-técnica) e §6, RS03–RS04.

  **Entrega:** conferir ambiente e scripts existentes, instalar dependências pelo lockfile e substituir a demonstração do Vite por uma base mínima do aplicativo. Organizar os módulos conforme necessário, sem adicionar framework ou backend.

  **Aprovação:** `npm ci` e `npm run build` terminam sem erros; `npm run dev` abre a aplicação sem a demonstração/contador do Vite e sem erros no console. A página identifica o Projeto Clima e usa idioma `pt-BR`. Nenhuma chamada meteorológica ocorre nessa etapa.

  **Registro de implementação (28/09/2026):** base mínima implementada em `src/main.ts` e `src/style.css`; idioma e título ajustados em `index.html`; favicon substituído em `public/favicon.svg`. Removidos o contador e os assets da demonstração. Mantidos os scripts e dependências existentes; módulos de domínio serão criados nas tarefas correspondentes.

  - [x] Ambiente conferido: Node.js v24.21.0 e npm 11.19.0.
  - [x] `npm ci` concluído sem erros, com 16 pacotes instalados.
  - [x] `npm run build` aprovado com TypeScript e Vite v8.3.1.
  - [x] `npm run dev -- --host 127.0.0.1` iniciado; `http://127.0.0.1:5173/` respondeu HTTP 200.
  - [x] HTML servido identifica “Projeto Clima” e declara `lang="pt-BR"`; código da tela contém apenas a base do aplicativo, sem contador ou chamadas meteorológicas.
  - [ ] Abrir a página em navegador e confirmar renderização e ausência de erros no console. Bloqueio da sessão: navegador integrado indisponível e inventário de navegadores conectados vazio. A inspeção de código e a resposta HTTP não substituem essa verificação.

  **Situação:** implementação pronta; aprovação da T01 pendente da verificação no navegador. Manter a tarefa desmarcada até essa confirmação e não iniciar T02 automaticamente.

- [x] **T02 — Definir contratos e validação dos dados**

  **Referências:** PRD, [§4 — Dados](./prd.md#4-dados-e-regras-de-apresentação) e §5, contratos e robustez.

  **Entrega:** criar tipos de localização, condições atuais, unidades e resultado de serviço, além da validação em runtime dos dados externos. Manter funções reutilizáveis pelas próximas tarefas.

  **Aprovação:** verificações controladas aceitam dados válidos, coordenadas zero, temperaturas negativas, percentuais zero e código meteorológico inteiro desconhecido. Rejeitam campos obrigatórios ausentes ou nulos, tipos incorretos, valores não finitos, limites inválidos, timezone inválido e data/hora inválida. Valores ausentes não viram zero; os contratos compilam sem erro.

  **Registro de implementação:** tipos criados em `src/types/weather.ts` exclusivamente com `type`; validadores reutilizáveis em `src/utils/validators.ts`; verificações automatizadas em `tests/validators.test.mjs` e comando `npm test` adicionado ao `package.json`, sem novas dependências.

  - [x] Dados completos, coordenadas zero, temperaturas negativas, percentuais zero e códigos inteiros desconhecidos aceitos.
  - [x] Campos obrigatórios ausentes/nulos, tipos incorretos, números não finitos e valores fora dos limites rejeitados, sem coerção para zero.
  - [x] Timezones inválidos e datas impossíveis rejeitados, incluindo dias inexistentes, regras de ano bissexto e limites de horário.
  - [x] Unidades métricas validadas e valores originais preservados.
  - [x] `npm test`: 12 testes aprovados, nenhuma falha, usando Node.js v24 e seu executor nativo com suporte a TypeScript.
  - [x] `npm run build`: TypeScript e build Vite concluídos sem erros.

  **Continuidade para T03:** os validadores recebem `unknown` e retornam type guards; não fazem requisições, não alteram dados e não selecionam resultados da API. `isLocation` valida uma localização individual. `isCurrentWeather` valida o objeto contendo `current` e `current_units`, exigindo as unidades métricas do PRD; campos extras do provedor são permitidos. Datas locais são validadas sem conversão para o fuso do dispositivo. Os serviços futuros devem converter dados inválidos em `Result` de falha. A T02 foi executada por solicitação explícita do usuário; a pendência de navegador da T01 continua sem aprovação.

- [x] **T03 — Implementar o serviço de geocodificação**

  **Referências:** PRD, §3, RF03; §4, localização; §5, endpoint de geocodificação e robustez.

  **Entrega:** implementar `getLocation` na camada Open-Meteo, com construção segura da URL, validação de entrada/saída e falhas controladas. Incluir timeout e suporte a cancelamento na infraestrutura de requisição reutilizável.

  **Aprovação:** com `fetch` controlado, entrada vazia não gera chamada; nome com acentos e espaços é codificado corretamente; parâmetros correspondem ao PRD. Resposta válida entrega a localização esperada; lista vazia, `results` ausente ou localização inválida retornam falha controlada. HTTP de erro, erro do provedor, JSON inválido, falha de rede, timeout e cancelamento encerram a operação sem rejeição não tratada. Não há repetição automática nem consulta de clima nesta função.

  **Registro de implementação:** serviço criado em `src/services/openMeteo.ts`, com `getLocation` e transporte interno reutilizável `requestJson`. Testes adicionados em `tests/openMeteo.test.mjs`, sem novas dependências.

  - [x] Entradas vazias, ausentes ou de tipo incorreto não geram chamada.
  - [x] URL codifica acentos, espaços e caracteres reservados; parâmetros conferidos contra o PRD.
  - [x] Localização válida e coordenadas zero aceitas; primeiro resultado válido selecionado.
  - [x] Lista vazia, `results` ausente, estrutura inválida e localização inválida tratados sem exceção não capturada.
  - [x] Erros HTTP, do provedor, de JSON e de rede retornam falha controlada sem retry.
  - [x] Timeout de 15 segundos e cancelamento testados durante a requisição e durante a leitura do JSON; sinal previamente cancelado impede a chamada.
  - [x] Timers e listeners liberados ao encerrar a operação; nenhuma consulta de clima realizada.
  - [x] `npm test`: 24 testes aprovados (12 novos e 12 da T02), sem falhas; timeout verificado com relógio simulado.
  - [x] `npm run build`: TypeScript e Vite aprovados.

  **Continuidade para T04:** reutilizar `requestJson` dentro do mesmo módulo. O transporte retorna `unavailable` para erro técnico, erro do provedor, timeout ou cancelamento, preservando o contrato `Result` definido na T02. `getLocation` retorna `invalid-input` para entrada inválida e `not-found` para resultados ausentes/vazios; conteúdo malformado retorna `unavailable`. Os testes usam `fetch` controlado; integração real permanece prevista na T11. A pendência visual da T01 permanece registrada e não foi aprovada nesta tarefa.

- [x] **T04 — Implementar o serviço de condições atuais**

  **Referências:** PRD, §3, RF04; §4, clima; §5, endpoint de clima e robustez.

  **Entrega:** implementar `getCurrentWeather`, reutilizando a infraestrutura da tarefa anterior. Preservar unidades e valores originais no modelo validado.

  **Aprovação:** localização inválida não gera requisição; localização válida produz URL com suas coordenadas, timezone, variáveis e unidades definidos no PRD. Resposta completa retorna sucesso; campo obrigatório inválido/ausente retorna falha controlada. Unidades são associadas aos respectivos valores. As falhas técnicas e o cancelamento seguem o tratamento da T03. Toda comunicação com o provedor permanece na camada de serviço.

  **Registro de implementação:** `getCurrentWeather` adicionado a `src/services/openMeteo.ts`, reutilizando `requestJson`, os tipos existentes e os validadores da T02. Criado `tests/currentWeather.test.mjs`, sem novas dependências.

  - [x] Localização inválida, incompleta ou ausente retorna `invalid-input` sem requisição.
  - [x] URL de forecast usa coordenadas, timezone codificado, variáveis e unidades do PRD; coordenadas zero aceitas.
  - [x] Resposta completa preserva valores originais e respectivas unidades, sem arredondamento ou mutação.
  - [x] Campos e unidades obrigatórios ausentes, nulos ou inválidos retornam `unavailable`.
  - [x] Falhas HTTP, JSON, rede e erro do provedor tratados sem retry; timeout de 15 segundos e cancelamento verificados durante fetch e leitura do corpo.
  - [x] Sinal previamente cancelado impede chamada; timers e listeners são liberados ao finalizar.
  - [x] Inspeção de `src` confirmou que o único `fetch` e os endpoints Open-Meteo continuam em `services/openMeteo.ts`, sem declarações `interface`.
  - [x] `npm test`: 35 testes aprovados, incluindo 11 novos da T04 e os 24 anteriores.
  - [x] `npm run build`: TypeScript e Vite aprovados.

  **Continuidade para T05:** o resultado de sucesso contém `current` e `current_units` validados, mantendo os nomes de campos do provedor e os valores sem formatação. A formatação deve ser aplicada na camada de apresentação. Os testes desta tarefa usam respostas controladas; a consulta real permanece prevista na T11. A pendência visual da T01 permanece registrada.

- [x] **T05 — Implementar descrições e formatação**

  **Referências:** PRD, [§4 — Dados e regras de apresentação](./prd.md#4-dados-e-regras-de-apresentação); §3, RF09–RF11.

  **Entrega:** criar mapeamento de condições e ícones, formatação numérica, direção cardinal, indicação dia/noite e data no fuso da cidade.

  **Aprovação:** todos os códigos da tabela do PRD têm descrição correspondente; código desconhecido usa a descrição alternativa. Verificações cobrem casas decimais e locale, os oito setores do vento, equivalência entre 0° e 360°, exemplo de 124° e ambos os valores de `is_day`. Um instante controlado próximo à virada do dia produz a data correta em fusos diferentes, independentemente do fuso do dispositivo.

  **Registro de implementação:** criados `src/utils/weatherCodes.ts`, `src/utils/formatters.ts` e `tests/formatters.test.mjs`, sem dependências adicionais e usando exclusivamente `type` para contratos.

  - [x] Os 29 códigos previstos têm descrição em português e ícone associado; códigos desconhecidos usam “Condição não identificada”.
  - [x] `is_day` define “Dia”/“Noite” com ícones distintos, sem consultar o relógio.
  - [x] Temperaturas e velocidades usam `pt-BR` com até uma casa decimal; percentuais não têm decimais. Unidades são recebidas explicitamente do modelo validado.
  - [x] Oito setores do vento, limites de cada setor, equivalência cardinal de 0°/360° e `124° (SE)` verificados.
  - [x] Data inclui dia da semana e data no fuso da cidade; virada de dia/ano verificada com instante controlado e processos executados em três fusos de dispositivo distintos.
  - [x] `npm test`: 44 testes aprovados, incluindo 9 novos da T05 e os 35 anteriores.
  - [x] `npm run build`: TypeScript e Vite aprovados.

  **Continuidade:** formatadores consomem dados já validados; não fazem requisições nem alteram o modelo. `formatCurrentDate(timeZone, now?)` usa o instante atual por padrão e aceita `Date` explícito para testes, sem interpretar `current.time` como horário do dispositivo. `getWeatherDescription` entrega descrição e símbolo Unicode decorativo; `getDayPeriod` entrega texto e ícone de período. Ao integrar na T07, manter texto visível e aplicar `aria-hidden` aos ícones decorativos. Nos limites entre setores do vento, o limite pertence ao setor seguinte no sentido horário. T06 permanece pendente; a pendência visual da T01 permanece registrada.

- [ ] **T06 — Construir a busca e o estado inicial**

  **Referências:** PRD, §3, RF01–RF02 e RF12, estados da interface; [§7 — Visual e UX](./prd.md#7-instruções-visuais-e-ux); §9.

  **Entrega:** criar formulário, campo, botão com lupa integrado e painel inicial, seguindo a composição visual do PRD. Preparar um único evento de submissão para a integração posterior.

  **Aprovação:** a página abre com a mensagem inicial prevista e sem dados fictícios. Enter e clique na lupa acionam o mesmo evento sem recarregar a página. Entrada vazia mostra a orientação definida; a entrada válida é normalizada sem impedir acentos ou nomes compostos. Campo e botão possuem nomes acessíveis e foco visível. Digitar e abrir a página não geram requisições; a conexão com os serviços fica para T08.

  **Registro de implementação:** criado `src/components/searchForm.ts` com callback `SearchHandler` declarado via `type`; `src/main.ts` monta busca e painel inicial; `src/style.css` define composição, foco e estilos. Adicionado `tests/searchForm.test.mjs` e `jsdom` como dependência de desenvolvimento em `package.json`/`package-lock.json` para verificar o DOM sem incluir dependências de runtime no aplicativo.

  - [x] Mensagem inicial definida conforme PRD, sem dados fictícios ou integração com serviços.
  - [x] Formulário nativo com botão de submissão; um único handler cancela a navegação e entrega a cidade normalizada ao callback.
  - [x] Testes DOM verificam clique, evento submit, bloqueio de entrada vazia, foco no campo inválido, preservação de acentos/nomes compostos e limpeza de mensagens.
  - [x] Rótulo “Cidade”, botão “Buscar clima”, mensagem associada ao campo e estilos de foco implementados.
  - [x] Criação e digitação não acionam callback de busca; código da interface não chama a API.
  - [x] `npm test`: 48 testes aprovados, incluindo 4 novos testes DOM e 44 anteriores.
  - [x] `npm run build`: TypeScript e Vite aprovados.
  - [ ] Conferir em navegador real a abertura do painel, foco visível e submissão por Enter sem recarregar. Nesta sessão, o inventário de apps/navegadores retornou vazio; jsdom verifica eventos e DOM, mas não renderização ou submissão implícita por teclado.

  **Situação:** implementação concluída, aprovação final pendente da conferência em navegador; manter T06 desmarcada. Para T08, fornecer a função de busca ao callback de `createSearchForm`; por enquanto o callback não executa ações. A pendência visual da T01 também permanece registrada.

- [ ] **T07 — Construir o painel de resultado e os demais estados**

  **Referências:** PRD, §3, estados e RF06–RF11; §4; §7, composição e hierarquia.

  **Entrega:** implementar renderização de loading, resultado e ausência de resultado. Integrar os formatadores à sidebar e aos quatro indicadores. Aplicar o layout desktop e o crédito Open-Meteo.

  **Aprovação:** em validação com dados controlados, cada estado mostra apenas seu conteúdo correspondente. O resultado contém todos os campos previstos, com descrições, unidades e hierarquia corretas. Sidebar e indicadores ficam no mesmo painel branco, centralizado, limitado a 800 px. Loading e ausência usam as mensagens do PRD. Nome de cidade contendo marcação HTML aparece como texto, sem criar elementos ou executar código. Nenhum dado simulado permanece no fluxo normal.

  **Registro de implementação:** criado `src/components/weatherPanel.ts` com `WeatherPanelState` declarado via `type`, criação do painel e renderização dos quatro estados. `src/main.ts` usa o componente no estado inicial. `src/style.css` inclui sidebar, grade de indicadores, estados, crédito e indicador de carregamento. Criado `tests/weatherPanel.test.mjs`, sem novas dependências.

  - [x] Estados inicial, carregando, resultado e sem resultado substituem o conteúdo anterior, sem sobreposição de estados.
  - [x] Sidebar e quatro indicadores incluem campos, descrições e unidades do PRD, reutilizando os formatadores da T05.
  - [x] Mensagens de loading e ausência correspondem ao PRD; `aria-busy` acompanha o loading e ícones são decorativos.
  - [x] Nome de cidade contendo HTML é inserido com `textContent`; testes confirmam ausência de elementos e handlers injetados.
  - [x] Crédito com link Open-Meteo junto ao painel; dados simulados restritos aos testes e nenhuma chamada de API na interface.
  - [x] CSS implementa painel branco centralizado de até 800 px, sidebar à esquerda, grade 2 × 2 e preferência por movimento reduzido.
  - [x] `npm test`: 53 testes aprovados, incluindo 5 novos do painel e os 48 anteriores.
  - [x] `npm run build`: TypeScript e Vite aprovados.
  - [ ] Verificar visualmente em navegador a hierarquia, sidebar e indicadores no mesmo painel branco, centralizado e limitado a 800 px. O inventário da sessão retornou apps e navegadores vazios; testes DOM não verificam a renderização visual.

  **Situação:** implementação concluída; aprovação final da T07 pendente de inspeção visual, mantendo a tarefa desmarcada. Para T08, usar `renderWeatherPanel(panel, state)`; o estado `success` recebe `location` e `weather` já validados e substitui o painel em uma única operação. O argumento opcional `now` serve para testes de data. A busca permanece sem integração de serviços até T08. Pendências visuais de T01/T06 mantidas.

- [x] **T08 — Integrar o fluxo completo de busca**

  **Referências:** PRD, [§3 — Fluxo](./prd.md#3-fluxo-e-requisitos-funcionais), §5, estado explícito; §8, critérios 1–8 e 16.

  **Entrega:** conectar submissão, serviços e renderização com estados `idle`, `loading`, `success` e `empty`. Garantir uma única operação percebida pelo usuário.

  **Aprovação:** uma submissão válida chama primeiro geocodificação e depois clima com a localização recebida. Há loading contínuo entre as duas chamadas e atualização conjunta do painel apenas ao final. Resultado anterior desaparece ao iniciar nova consulta. Cidade não encontrada impede a chamada de clima; localização ou clima inválidos levam ao mesmo estado sem resultado. O texto pesquisado é preservado e nova tentativa funciona. Entrada vazia e digitação sem submissão continuam sem gerar chamadas.

  **Registro de implementação:** criado `src/app.ts` para montar a aplicação e coordenar formulário, serviços e estados do painel; `src/main.ts` passa a chamar `mountApp`. Adicionado `tests/app.test.mjs` com integração DOM usando os componentes, serviços e validadores reais, interceptando apenas `fetch`.

  - [x] Inicialização, digitação e submissão vazia não geram requisições.
  - [x] Submissão consulta geocodificação e depois forecast com coordenadas e timezone recebidos.
  - [x] Loading aparece imediatamente e mantém o mesmo indicador entre as duas requisições; resultado completo aparece apenas ao final.
  - [x] Localização ausente/inválida impede forecast; clima inválido usa o mesmo estado sem resultado.
  - [x] Texto pesquisado preservado; tentativa após falha funciona; nova consulta oculta e substitui o resultado anterior.
  - [x] `npm test`: 59 testes aprovados, incluindo 6 novos de integração e 53 anteriores.
  - [x] `npm run build`: TypeScript e Vite aprovados.

  **Continuidade para T09:** estados explícitos são coordenados em `src/app.ts`. Há identificação incremental da busca para descartar operações antigas e tratamento de exceções; a matriz completa de falhas e concorrência deve ser verificada na T09, que permanece pendente. A aprovação da T08 cobre integração com respostas controladas, sem afirmar teste de API real ou de navegador. As pendências visuais de T01/T06/T07 permanecem registradas; submissão implícita por Enter em navegador ainda depende da verificação da T06.

- [x] **T09 — Verificar falhas e proteger buscas concorrentes**

  **Referências:** PRD, §5, robustez; §8, critérios 9–10.

  **Entrega:** garantir encerramento do loading em falhas e impedir que operações anteriores alterem o estado de uma busca mais recente. Implementar cancelamento ou identificação de operação conforme necessário.

  **Aprovação:** simular, em cada etapa da consulta, erro HTTP, JSON inválido, falha de rede e timeout; todos terminam em estado recuperável, sem erro não tratado. Ao iniciar busca A e depois B, respostas ou falhas tardias de A não substituem o resultado nem encerram o loading de B. A mesma proteção funciona quando B não encontra resultado. Após cada cenário, uma nova busca válida funciona e não há retry automático.

  **Registro de implementação:** ampliado `tests/app.test.mjs` com 21 cenários de integração para falhas e concorrência. A identificação incremental existente em `src/app.ts` passou pela matriz de verificação; mantida essa estratégia e documentada sua obrigação de verificar a busca vigente após cada `await`. Não foi necessário alterar o comportamento já implementado na T08.

  - [x] HTTP de erro, JSON inválido, falha de rede e timeout simulados nas etapas de geocodificação e forecast; loading encerrado e estado sem resultado exibido.
  - [x] Timeout de 15 segundos verificado com relógio simulado; avanço adicional de 60 segundos confirma ausência de retry automático.
  - [x] Sucesso e falha tardios de A, em ambas as etapas, não alteram B carregando, com sucesso ou sem resultado.
  - [x] Falha tardia do forecast de A não encerra o loading durante o forecast de B.
  - [x] Nova busca válida após cada cenário funciona, preservando entrada e exibindo resultado completo; contagem de chamadas confirma ausência de requisições extras.
  - [x] `npm test`: 80 testes aprovados, incluindo 21 novos e 59 anteriores, sem rejeições não tratadas reportadas pelo executor.
  - [x] `npm run build`: TypeScript e Vite aprovados.

  **Continuidade para T10:** a proteção usa identificação da operação, sem cancelamento automático ao substituir uma busca. Requisições antigas podem terminar ou atingir seu timeout, mas não atualizam o painel nem iniciam a etapa seguinte quando já obsoletas. T10 permanece pendente; as verificações visuais de T01/T06/T07 também permanecem registradas.

- [ ] **T10 — Ajustar responsividade e acessibilidade**

  **Referências:** PRD, [§6 — Qualidade](./prd.md#6-requisitos-de-sistema-e-qualidade), RNF01–RNF04; §7; §8, critérios 13–14.

  **Entrega:** adaptar todos os estados a telas pequenas, revisar navegação por teclado, semântica e anúncios de estado. Aplicar preferência por movimento reduzido.

  **Aprovação:** inspecionar larguras de 320, 375, 640 e 1024 px, incluindo cidade e descrição longas: não há rolagem horizontal ou conteúdo cortado; sidebar empilha em telas pequenas e desktop mantém a composição prevista. Toda a busca funciona por teclado com foco visível. `aria-busy` acompanha o loading e a região `aria-live` comunica mudanças; verificar os anúncios com leitor de tela. Contraste de texto normal atinge 4,5:1, informação não depende só de cor/ícone e movimento reduzido é respeitado.

  **Registro de implementação:** ajustados `src/style.css`, `src/app.ts`, `src/components/weatherPanel.ts` e `src/components/searchForm.ts`. Atualizados os testes de integração e painel para verificar a região de anúncio independente. Contratos continuam definidos com `type`.

  - [x] CSS ajustado: empilhamento até 700 px, indicadores em uma coluna abaixo de 400 px, quebra de textos longos, temperatura com tamanho fluido e painel com largura máxima herdada de 800 px. Breakpoint ajustado a partir da referência do PRD para acomodar conteúdo em larguras intermediárias.
  - [x] Região persistente `role="status"`, `aria-live="polite"` e `aria-atomic="true"` fora do painel ocupado anuncia loading, sucesso e ausência. Removido o anúncio integral do painel para evitar duplicação; `aria-busy` continua no painel. Testes verificam textos e localização da região no DOM.
  - [x] Mantidos controles nativos, rótulos, estilos de foco e mensagem associada ao campo; adicionado `enterkeyhint="search"` para teclado móvel. Ícones continuam decorativos e acompanhados de texto.
  - [x] Contraste calculado por luminância relativa sRGB: texto principal/branco 16,40:1; secundário/branco 6,14:1; secundário/cards 5,62:1; erro/fundo escuro 10,29:1; foco/branco 6,55:1.
  - [x] Mantida regra `prefers-reduced-motion` que desativa a animação; adicionadas bordas para modo de cores forçadas e esquema claro explícito nos controles.
  - [x] `npm test`: 80 testes aprovados com as verificações de anúncios atualizadas.
  - [x] `npm run build`: TypeScript e Vite aprovados.
  - [ ] Inspecionar todos os estados em 320, 375, 640 e 1024 px, com cidade e descrição longas, verificando ausência de corte/overflow e composição desktop.
  - [ ] Verificar Tab, Shift+Tab, Enter e ativação da lupa por teclado em navegador real, com foco visível.
  - [ ] Ouvir anúncios de loading, sucesso e ausência com leitor de tela; confirmar movimento reduzido em navegador.

  **Situação:** ajustes implementados, aprovação final pendente das verificações visuais e com leitor de tela. Nesta sessão, o inventário retornou apps e navegadores vazios. Testes DOM e cálculos de contraste não substituem essas verificações; manter T10 desmarcada. Pendências anteriores de T01/T06/T07 também permanecem registradas.

- [ ] **T11 — Validar o MVP integrado e a execução de produção**

  **Referências:** PRD, [§8 — Critérios de aceite](./prd.md#8-critérios-de-aceite), §2 e §6, RS01–RS05 e RNF05–RNF06.

  **Entrega:** executar a validação final, corrigir regressões e registrar evidências da entrega. Conferir que o build funciona como aplicação estática e que não foram incluídas funcionalidades fora do escopo.

  **Aprovação:** todos os 16 critérios do §8 possuem resultado de verificação registrado, aproveitando evidências anteriores ainda válidas. `npm run build` passa e `npm run preview` serve o aplicativo funcional. Uma busca real completa as duas chamadas Open-Meteo e exibe dados coerentes com as respostas; cenários extremos e falhas são cobertos por respostas controladas. Não há erros não tratados no console, persistência de pesquisas, chamadas diretas ao provedor fora do serviço ou dependência de backend próprio. Registrar comandos para executar e conferir o projeto. A publicação em provedor externo não faz parte desta tarefa; o artefato deve estar pronto para hospedagem estática com HTTPS.

  **Registro de validação:** criados [relatório com os 16 critérios](./validation.md) e [README com comandos de execução](../README.md). Não foram identificadas regressões nos testes executados.

  - [x] `npm test`: 80 testes aprovados, cobrindo dados, integração, falhas e concorrência.
  - [x] `npm run build`: TypeScript e Vite aprovados; artefato estático gerado em `dist/`.
  - [x] Preview iniciado em `http://127.0.0.1:4173/`; HTML, JavaScript e CSS responderam HTTP 200.
  - [x] Consulta real a São Paulo completou geocodificação e forecast pelos serviços do projeto, com respostas válidas.
  - [x] `npm run verify:production`: bundle compilado executado em DOM simulado com API real; duas chamadas, cidade/temperatura/quatro indicadores conferidos e zero erros capturados. Script em `scripts/verify-production.mjs`; não substitui inspeção em navegador.
  - [x] Inspeção confirmou ausência de persistência, backend próprio e chamadas ao provedor fora da camada de serviço.
  - [x] Todos os 16 critérios possuem resultado e evidência registrados em `validation.md`.
  - [x] Comandos para instalar, executar, testar, gerar e conferir produção documentados no README.
  - [ ] Confirmar consulta real e exibição coerente no preview em navegador, sem erros de console.
  - [ ] Concluir inspeção visual, teclado e leitor de tela pendentes de T01/T06/T07/T10.

  **Situação:** validações disponíveis concluídas; T11 permanece desmarcada porque não há navegador/apps conectados nesta sessão. A consulta real no Node.js e testes DOM não comprovam comportamento no navegador. Não houve publicação externa.

## Rastreabilidade dos critérios de aceite

Os números abaixo se referem ao [§8 do PRD](./prd.md#8-critérios-de-aceite). A T11 confirma a cobertura completa, sem exigir repetir verificações já válidas sem motivo.

| Critérios do PRD | Tarefas responsáveis |
| --- | --- |
| 1–2 — Inicialização e entrada vazia | T06, T08 |
| 3–4 — Duas chamadas e loading único | T03, T04, T08 |
| 5–6 — Campos, unidades e valores válidos | T02, T04, T05, T07 |
| 7–8 — Ausência de localização ou clima | T03, T04, T08 |
| 9–10 — Falhas, recuperação e concorrência | T03, T04, T09 |
| 11–12 — Data, período e condições | T05, T07 |
| 13–14 — Responsividade e acessibilidade | T07, T10 |
| 15 — Build | T01, T11; manter compilação nas demais entregas |
| 16 — Enter e ícone de busca | T06, T08, T10 |
