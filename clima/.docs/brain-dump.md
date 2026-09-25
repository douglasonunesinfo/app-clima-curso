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
current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,wind_speed_10m,
wind_direction_10m,wind_gusts_10m,precipitation,weather_code&timezone={TIMEZONE}

{LATITUDE} = Latitude
{LONGITUDE} = Longitude
{TIMEZONE} = Timezone

Exemplo de resposta:

{
  "latitude": -22.952549,
  "longitude": -43.215027,
  "generationtime_ms": 0.580310821533203,
  "utc_offset_seconds": -10800,
  "timezone": "America/Sao_Paulo",
  "timezone_abbreviation": "GMT-3",
  "elevation": 12,
  "current_units": {
    "time": "iso8601",
    "interval": "seconds",
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
    "time": "2026-09-25T17:00",
    "interval": 900,
    "temperature_2m": 23.6,
    "relative_humidity_2m": 82,
    "apparent_temperature": 25.6,
    "is_day": 1,
    "wind_speed_10m": 14,
    "wind_direction_10m": 114,
    "wind_gusts_10m": 34.6,
    "precipitation": 0,
    "weather_code": 1
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








