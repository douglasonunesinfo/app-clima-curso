# Projeto Clima

Este projeto vai pegar a cidade e baseado nisso, consultar o clima daquela região, exibindo as principais informaçoes de clima, temperatura, umidade, e etc.

### Aspectos Técnicos

O projeto vai ser feito em Vite + Vanilla + Typescript

### Informações da API que será usada no projeto:
Ele vai usar a API OpenMeteo, com os seuintes endpoints:

### Para Pegar a latitude, longitude e timezone, baseado no nome da cidade:
https://geocoding-api.open-meteo.com/v1/search?name={NOME_DA_CIDADE}&count=1&language=pt&format=json

{NOME_DA_CIDADE} = Nome da cidade que o usuário digitou

Exemplo de resposta:

{
  "results": [
    {
      "id": 3451190,
      "name": "Rio de Janeiro",
      "latitude": -22.90642,
      "longitude": -43.18223,
      "elevation": 12,
      "feature_code": "PPLA",
      "country_code": "BR",
      "admin1_id": 3451189,
      "admin2_id": 6322060,
      "timezone": "America/Sao_Paulo",
      "population": 6747815,
      "country_id": 3469034,
      "country": "Brasil",
      "admin1": "Rio de Janeiro",
      "admin2": "Rio de Janeiro"
    }
  ],
  "generationtime_ms": 1.2184381
}

Informações que PRECISAMOS:
-name
-latitude
-longitude
-country_code
-timezone

#### Para pegar as informações de clima:
https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&
current=precipitation_probability,temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,
wind_direction_10m,wind_gusts_10m,precipitation,weather_code&timezone={TIMEZONE}

{LATITUDE} = Latitude
{LONGITUDE} = Longitude
{TIMEZONE} = Timezone

Exemplo de resposta:
Na respostas eu tenho 2 itens:
- current_units tem as unidades de medida das propriedades
- current tem os valores das propriedades

Propriedades obrigatórias:
- temperature_2m
- relative_humidity_2m
- apparent_temperature
- is_day
- wind_speed_10m
- wind_direction_10m
- precipitation_probability





{
  "latitude": 52.52,
  "longitude": 13.419998,
  "generationtime_ms": 0.239014625549316,
  "utc_offset_seconds": -10800,
  "timezone": "America/Sao_Paulo",
  "timezone_abbreviation": "GMT-3",
  "elevation": 38,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
    "precipitation_probability": "%",
    "temperature_2m": "°C",
    "relative_humidity_2m": "%",
    "apparent_temperature": "°C",
    "is_day": "",
    "wind_speed_10m": "km/h",
    "wind_direction_10m": "°",
    "wind_gusts_10m": "km/h",
    "precipitation": "mm",
    "weather_code": "wmo code"
  },
  "current": {
    "time": "2026-09-28T19:15",
    "interval": 900,
    "precipitation_probability": 0,
    "temperature_2m": 17.1,
    "relative_humidity_2m": 69,
    "apparent_temperature": 16.6,
    "is_day": 0,
    "wind_speed_10m": 6.5,
    "wind_direction_10m": 124,
    "wind_gusts_10m": 17.3,
    "precipitation": 0,
    "weather_code": 3
  }
}

Informações que precisamos da resposta:


#### Informação importante:
Teremos um arquivo com as funçoes do OpenMeteo, para que o projeto não faça requisição direta a API mas sim use as funçoes desse arquivo.

Fluxo de pesquisa para receber o nome da cidade e pegar as informaçoes de clima:

- O usuário digita o nome da cidade
- O projeto pega o nome e usa o Open Meteo para pegar a latitude, longitude e timezone dessa cidade.
- Ao pegar latitude, longitude, e timezone, o projeto usa essas informaçoes para fazer a requisição e pegar as informações do clima dessa localização.
- Caso não ache as informações da cidade, se comprotar cmo se não tivesse cahado nada.
- Caso ache as informaçoes da cidade, mas não as de clima, se comportar como senão tivesse achado nada.

A busca envolve as 2 requisiçoes (buscr latitude/longitude timezone + buscar clima), mas para o usuário é uma só, com loading.

As funçoes do OpenMeteo devem verificar se os parametros vieram, caso contrário, age como se não tivesse vindo.

### Aspectos visuais (designt e UX)

Tem que ter Emptv State.

Teremos uam área SUPERIOR centralizada que tem apenas o campo de busca da cidade.

O projeto terá um sidebar na esquerda com as seguitnes informações:
- Temperatura 
_ Nome da cidade, código do país
- Dia atual
- Se é dia ou noite, (baseado no is_day)
- Weather Code

Informações de interpretação sobre o Weather Code:
WMO Weather interpretation codes (WW)
Code	Description
0	Clear sky
1	Mainly clear
2	Partly cloudy
3	Overcast
45	Fog
48	Depositing rime fog
51	Light drizzle
53	Moderate drizzle
55	Dense drizzle
56	Light freezing drizzle
57	Dense freezing drizzle
61	Slight rain
63	Moderate rain
65	Heavy rain
66	Light freezing rain
67	Heavy freezing rain
71	Slight snowfall
73	Moderate snowfall
75	Heavy snowfall
77	Snow grains
80	Slight rain showers
81	Moderate rain showers
82	Violent rain showers
85	Slight snow showers
86	Heavy snow showers
95	Thunderstorm
96	Thunderstorm with slight hail *
97	Heavy thunderstorm
99	Thunderstorm with heavy hail *

Na area principal: 
-Umidade realtiva
-Temperatura aparente
-Probalidade de precipitação
- Velicidade/Direção do vento

Design geral:
- O projeto tera um fundo cinza escuro
- A parte superior nao tera background, mas tanto sidebar, qunado a area principal ficarão dentro de uma div com borda bem arredondada, fundo branco centralizada e larguar máxima de 800 px.





