# PRD — Projeto Clima

Data: 28/09/2026  
Fonte de requisitos: [brain-dump.md](./brain-dump.md).  
Status: especificação do MVP com acionamento da busca confirmado pelo usuário.

## 1. Objetivo e análise do escopo

Criar uma aplicação web em português que permita consultar as condições meteorológicas atuais de uma cidade. O usuário informa o nome da cidade e recebe um painel simples com temperatura, condição do tempo e indicadores complementares.

O produto atende pessoas que desejam uma consulta rápida, sem cadastro. O sucesso do MVP consiste em concluir a busca, apresentar os dados da localização retornada e comunicar claramente carregamento ou ausência de informações.

O brain-dump define a stack, o provedor, o fluxo e a composição visual. Este PRD transforma essas definições em comportamentos verificáveis. Valores de espaçamento, tipografia e organização de arquivos são orientações de implementação, não funcionalidades adicionais.

Pontos de análise:

- A busca é uma operação única para o usuário, embora dependa de duas requisições sequenciais.
- `weather_code` também é obrigatório para o painel, apesar de não aparecer na lista original de propriedades obrigatórias.
- `count=1` implica usar o primeiro resultado da geocodificação, inclusive para cidades homônimas; não haverá seleção de resultados no MVP.
- Rajadas e volume de precipitação constam da URL, mas não têm apresentação solicitada; podem ser recebidos sem gerar novos cards.
- Os exemplos de resposta são ilustrativos e não devem alimentar o painel como dados reais.
- O usuário confirmou que a busca deve ocorrer ao pressionar Enter ou clicar no ícone de busca dentro do campo.

## 2. Escopo funcional

### Incluído

- Pesquisa pelo nome da cidade.
- Geocodificação e consulta das condições atuais via Open-Meteo.
- Uma indicação de carregamento para toda a operação.
- Estados inicial, carregando, resultado e sem resultado.
- Sidebar com temperatura, cidade/país, dia atual, indicação de dia/noite e descrição da condição meteorológica.
- Área principal com umidade relativa, sensação térmica, probabilidade de precipitação e velocidade/direção do vento.
- Layout responsivo e operação por teclado.

### Fora do MVP

Login, favoritos, histórico persistente, localização automática por GPS, autocomplete, seleção entre cidades homônimas, mapas, previsão de vários dias, troca de unidades, atualização automática e backend próprio.

## 3. Fluxo e requisitos funcionais

| ID | Requisito | Comportamento esperado |
| --- | --- | --- |
| RF01 | Informar cidade | Disponibilizar campo com rótulo acessível “Cidade” e placeholder “Digite o nome da cidade”. Remover espaços nas extremidades antes da consulta. |
| RF02 | Validar entrada | Entrada vazia não gera requisição; orientar “Digite o nome de uma cidade”. Não impor restrição a acentos ou nomes compostos. |
| RF03 | Resolver localização | Consultar a geocodificação com `count=1`, `language=pt` e `format=json`; utilizar o primeiro resultado válido. |
| RF04 | Consultar clima | Utilizar latitude, longitude e timezone da localização encontrada na segunda requisição. |
| RF05 | Carregar | Exibir “Buscando clima…” desde o início da geocodificação até o término de toda a operação. Não exibir sucesso intermediário. |
| RF06 | Mostrar resultado | Atualizar sidebar e indicadores juntos, apenas quando localização e clima forem válidos. |
| RF07 | Tratar ausência | Sem cidade ou sem dados meteorológicos válidos, exibir o mesmo estado sem resultado. |
| RF08 | Permitir nova consulta | Manter a busca disponível após sucesso ou falha e substituir o resultado ao concluir outra consulta. |
| RF09 | Interpretar condição | Converter `weather_code` em descrição em português; usar ícone acompanhado de texto. |
| RF10 | Identificar período | `is_day=1` exibe “Dia”; `is_day=0` exibe “Noite”. A informação vem da API, não do relógio do dispositivo. |
| RF11 | Mostrar data local | Exibir dia da semana e data atual no timezone da cidade consultada, com formatação `pt-BR`. |
| RF12 | Acionar busca | Usar formulário submetido por Enter ou botão com ícone de lupa integrado visualmente ao campo, com nome acessível “Buscar clima”. Digitar não inicia consultas automaticamente. |

Sequência: validar entrada → carregar → buscar localização → validar localização → buscar clima → validar clima → apresentar resultado. Qualquer falha encerra o loading e permite nova busca.

### Estados da interface

| Estado | Conteúdo e comportamento |
| --- | --- |
| Inicial | Busca vazia e mensagem “Pesquise uma cidade para consultar o clima”. Nenhuma consulta automática ou dado fictício. |
| Carregando | Indicador e mensagem de progresso dentro do painel branco. Ocultar o resultado anterior para evitar associá-lo à nova busca. |
| Resultado | Sidebar e quatro indicadores preenchidos. |
| Sem resultado | Mensagem “Não foi possível encontrar informações de clima para essa cidade. Confira o nome e tente novamente”. Preservar o texto pesquisado. |

Falhas de rede, HTTP, leitura do JSON e respostas incompletas usam o mesmo estado visual sem resultado, conforme o comportamento geral definido no brain-dump. O serviço pode preservar a causa internamente para diagnóstico; a interface não deve afirmar que a cidade não existe.

## 4. Dados e regras de apresentação

### Localização

| Campo | Uso e validação |
| --- | --- |
| `name` | Nome retornado pela API, obrigatório e não vazio. |
| `country_code` | Código do país exibido ao lado da cidade, obrigatório. |
| `latitude` | Número finito entre -90 e 90. Zero é válido. |
| `longitude` | Número finito entre -180 e 180. Zero é válido. |
| `timezone` | Identificador de fuso válido, necessário para consulta e data local. |

### Clima

| Campo | Apresentação | Validação |
| --- | --- | --- |
| `temperature_2m` | Temperatura em °C, maior destaque da sidebar | Número finito, inclusive negativo ou zero. |
| `relative_humidity_2m` | “Umidade relativa”, em % | Número entre 0 e 100. |
| `apparent_temperature` | “Sensação térmica”, em °C | Número finito. |
| `is_day` | Texto e ícone de dia/noite | Somente 0 ou 1. |
| `wind_speed_10m` | “Vento”, em km/h | Número finito não negativo. |
| `wind_direction_10m` | Direção em graus e orientação cardinal | Número entre 0 e 360. |
| `precipitation_probability` | “Probabilidade de precipitação”, em % | Número entre 0 e 100. |
| `weather_code` | Descrição meteorológica | Inteiro; códigos desconhecidos têm descrição alternativa. |
| `current.time` | Referência temporal dos dados | Data/hora válida; não confundir com o horário da consulta. |

Usar as unidades correspondentes de `current_units` e solicitar explicitamente Celsius e km/h. Não transformar valores ausentes em zero. Campo obrigatório ausente, `null` ou inválido impede a exibição de um painel completo e leva ao estado sem resultado.

Formatar números com `Intl.NumberFormat('pt-BR')`, com até uma casa decimal para temperaturas e velocidade; percentuais sem casas decimais. Manter o valor original no modelo.

A direção do vento indica sua origem. Usar oito setores: N, NE, L, SE, S, SO, O e NO; considerar 360° equivalente a 0°. Exemplo: `124° (SE)`. Uma seta é complementar ao texto.

Calcular o dia atual com `Intl.DateTimeFormat('pt-BR', { timeZone })`. Não interpretar timestamps locais da API automaticamente como horário do dispositivo.

### Mapeamento de condições

Mapeamento em português derivado da tabela fornecida no brain-dump:

| Código | Descrição |
| --- | --- |
| 0 | Céu limpo |
| 1 | Predominantemente limpo |
| 2 | Parcialmente nublado |
| 3 | Encoberto |
| 45 | Nevoeiro |
| 48 | Nevoeiro com formação de geada |
| 51 / 53 / 55 | Garoa leve / moderada / intensa |
| 56 / 57 | Garoa congelante leve / intensa |
| 61 / 63 / 65 | Chuva leve / moderada / forte |
| 66 / 67 | Chuva congelante leve / forte |
| 71 / 73 / 75 | Neve leve / moderada / forte |
| 77 | Grãos de neve |
| 80 / 81 / 82 | Pancadas de chuva leves / moderadas / violentas |
| 85 / 86 | Pancadas de neve leves / fortes |
| 95 | Tempestade |
| 96 | Tempestade com granizo leve |
| 97 | Tempestade forte |
| 99 | Tempestade com granizo forte |
| Outro inteiro | Condição não identificada |

O código numérico não deve substituir a descrição legível. Um código desconhecido não invalida os demais dados.

## 5. Integração e arquitetura técnica

### Stack e organização

Usar Vite, TypeScript e JavaScript/DOM nativos, sem framework de interface. O repositório já contém a estrutura inicial dessa stack; a tela atual ainda é o exemplo do Vite.

Convenção de TypeScript: usar `type` para declarar tipos e contratos do projeto, em vez de `interface`.

Organização sugerida:

```text
src/
  main.ts                 # Eventos, estado e coordenação da interface
  style.css               # Layout, componentes e responsividade
  services/openMeteo.ts    # Toda comunicação com o provedor
  types/weather.ts        # Contratos de localização, clima e resultados
  utils/weatherCodes.ts   # Descrições e associação de ícones
  utils/formatters.ts     # Datas, números e direção do vento
```

Somente `services/openMeteo.ts` realiza requisições à Open-Meteo. A interface chama as funções exportadas e recebe dados validados. Esse isolamento é uma camada de serviço no frontend, não exige servidor intermediário.

Contratos sugeridos:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'invalid-input' | 'not-found' | 'unavailable' };

// Tipos Location e CurrentWeather definidos em types/weather.ts.
getLocation(city: string, signal?: AbortSignal): Promise<Result<Location>>;
getCurrentWeather(location: Location, signal?: AbortSignal): Promise<Result<CurrentWeather>>;
```

### Endpoints

Geocodificação:

```text
https://geocoding-api.open-meteo.com/v1/search?name={CIDADE}&count=1&language=pt&format=json
```

Clima, mantendo os campos previstos no documento original e explicitando unidades:

```text
https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=precipitation_probability,temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,weather_code&timezone={TIMEZONE}&temperature_unit=celsius&wind_speed_unit=kmh&precipitation_unit=mm
```

Construir as URLs com `URL` e `URLSearchParams`, codificando cidade e timezone. As variáveis entre chaves são placeholders e não devem ser enviadas literalmente.

A documentação informa que variáveis horárias também podem ser solicitadas em `current`; por isso, manter `precipitation_probability` nesse grupo, conforme o brain-dump. Ela representa probabilidade de precipitação, não volume nem probabilidade diária. [Documentação Forecast](https://open-meteo.com/en/docs).

A busca utiliza o endpoint de geocodificação e seus parâmetros documentados. A ausência de `results` ou uma lista vazia deve ser tratada sem tentar acessar o primeiro elemento. [Documentação Geocoding](https://open-meteo.com/en/docs/geocoding-api).

### Robustez

- Validar parâmetros antes do `fetch`; parâmetros obrigatórios ausentes retornam falha controlada sem requisição.
- Verificar `response.ok`, eventual erro do provedor e o formato do JSON. Tipos TypeScript não substituem validação em runtime.
- Validar localização antes de iniciar a segunda requisição.
- Usar timeout finito; referência de implementação: 15 segundos por requisição. Encerrar carregamento mesmo em erro.
- Usar identificador de busca ou cancelamento para impedir que uma resposta antiga sobrescreva uma consulta mais recente.
- Não repetir requisições automaticamente no MVP; permitir tentativa manual.
- Inserir cidade e demais textos externos com `textContent`, evitando interpolação insegura em HTML.
- Manter estado explícito: `idle`, `loading`, `success` ou `empty`. Atualizar resultado de forma atômica.

## 6. Requisitos de sistema e qualidade

| ID | Requisito |
| --- | --- |
| RS01 | Executar em navegador moderno com JavaScript, módulos ES, Fetch, AbortController e Intl habilitados. |
| RS02 | Ter conexão com a internet e acesso aos dois endpoints da Open-Meteo. |
| RS03 | Desenvolvimento com Node.js/npm compatíveis com as versões de Vite e TypeScript declaradas no projeto; instalação pelo lockfile com `npm ci`. |
| RS04 | `npm run dev` inicia desenvolvimento; `npm run build` verifica TypeScript e gera os arquivos de produção; `npm run preview` permite conferir o build. |
| RS05 | Publicar como site estático com HTTPS; não depender de banco de dados ou backend próprio para o MVP. |
| RNF01 | Layout funcional a partir de 320 px, sem rolagem horizontal e sem cortar nomes longos. |
| RNF02 | Campo e acionamento utilizáveis por teclado, foco visível e rótulos acessíveis. |
| RNF03 | Comunicar loading e resultado por região `aria-live`; marcar o painel com `aria-busy` durante a busca. |
| RNF04 | Texto normal com contraste mínimo de 4,5:1; informação compreensível sem depender só de cor ou ícones. |
| RNF05 | Mostrar loading imediatamente após iniciar a consulta; a latência final depende do provedor e da rede. |
| RNF06 | Não persistir pesquisas no MVP; o nome informado é enviado ao provedor para resolver a localização. |

Exibir crédito discreto com link para Open-Meteo junto ao painel, sem adicionar elementos à área superior de busca.

## 7. Instruções visuais e UX

### Composição obrigatória

- Fundo geral cinza escuro.
- Área superior centralizada contendo apenas o controle de busca, sem painel de fundo próprio.
- Abaixo, um único container branco centralizado, com largura máxima de **800 px** e bordas bem arredondadas.
- Sidebar à esquerda e área de indicadores à direita dentro desse mesmo container.
- Estados vazio e carregando ocupam o container branco.

### Direção de estilo sugerida

| Elemento | Orientação |
| --- | --- |
| Fundo da página | `#252830`. |
| Container | `#FFFFFF`, raio de 28 px e padding de 32 px no desktop. |
| Texto principal | `#18202B`; texto secundário `#596273`. |
| Indicadores | Superfícies discretas em `#F3F5F7`, raio de 16 px. |
| Tipografia | Fonte sans-serif do sistema; corpo de 16 px e títulos de indicadores de 14–16 px. |
| Temperatura | 56–64 px no desktop, com unidade visível. |
| Espaçamento | Escala de 8 px; intervalo de 24 px entre busca e painel. |
| Busca | Altura mínima de 48 px; largura limitada à do painel e identificação visível do foco. |

Sidebar com aproximadamente 30% da largura útil; área principal com o restante. Usar divisor vertical discreto e espaçamento suficiente entre as regiões. Exibir os quatro indicadores em grade 2 × 2, com rótulo, valor e unidade claramente associados.

Hierarquia da sidebar: temperatura em destaque → cidade e código do país → dia da semana/data → dia/noite → descrição e ícone da condição. Não usar o número WMO como informação principal.

### Responsividade

Como referência, abaixo de 640 px transformar a sidebar em bloco superior, com divisor horizontal. Manter duas colunas de indicadores quando houver espaço; reduzir a uma coluna quando necessário. Usar margem externa mínima de 16 px, padding interno de 20 px e permitir quebra de nomes e descrições longos.

### Estados vazios e interação

Usar mensagem centralizada, ícone simples opcional e altura suficiente para evitar um painel visualmente colapsado. Não preencher cards com zeros, traços ambíguos ou informações de exemplo. O estado sem resultado reutiliza essa estrutura com mensagem de nova tentativa.

O loading deve ter texto além da animação e respeitar preferência por movimento reduzido. Dia/noite muda texto e ícone; o fundo geral permanece na direção visual definida.

## 8. Critérios de aceite

1. Ao abrir a aplicação, aparecem a busca e o estado inicial, sem chamadas à API.
2. Entrada vazia ou composta apenas de espaços não inicia requisições.
3. Uma cidade válida produz geocodificação e, em seguida, consulta de clima com as coordenadas e o fuso recebidos.
4. A operação inteira apresenta um único loading, sem painel parcial entre as requisições.
5. Uma resposta válida preenche todos os campos previstos, com unidades e textos em português.
6. Zero em coordenadas, temperatura, vento ou probabilidade não é tratado como ausência; temperaturas negativas são aceitas.
7. Cidade não encontrada impede a segunda requisição e resulta no estado sem resultado.
8. Cidade encontrada com clima ausente, inválido ou indisponível resulta no mesmo estado sem resultado.
9. Erro HTTP, JSON inválido, falha de rede e timeout encerram o loading e permitem nova tentativa.
10. Uma nova consulta substitui o resultado anterior; respostas antigas não podem sobrescrever o resultado mais recente.
11. `is_day` controla corretamente “Dia” e “Noite”; a data usa o fuso da cidade mesmo quando difere do fuso do dispositivo.
12. Códigos meteorológicos conhecidos exibem as descrições mapeadas; código desconhecido exibe “Condição não identificada”.
13. Desktop apresenta sidebar e indicadores dentro do mesmo painel branco de até 800 px; mobile empilha as áreas sem overflow a 320 px.
14. Busca, foco e mensagens de estado funcionam com teclado e tecnologia assistiva.
15. `npm run build` termina sem erros na implementação concluída.
16. Enter e clique no ícone de busca executam o mesmo fluxo; digitar sem submeter não gera requisições. O botão com ícone também pode ser acionado por teclado.

Verificar esses cenários com respostas controladas da API e uma consulta real de integração. O presente documento especifica a implementação; não indica que essas verificações já foram executadas.

## 9. Decisão confirmada

A busca é submetida por Enter ou pelo ícone de lupa dentro do campo, conforme resposta do usuário. Não há decisões de produto pendentes para este PRD.
