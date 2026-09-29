# Projeto Clima

Consulta de condições meteorológicas por cidade usando Vite, TypeScript e Open-Meteo. A aplicação roda no navegador, sem backend próprio ou persistência de pesquisas.

## Executar

Ambiente usado na validação: Node.js 24.21.0 e npm 11.19.0. Os testes usam o suporte nativo a TypeScript do Node.js 24.

```sh
npm ci
npm run dev
```

Digite uma cidade e pressione Enter ou clique na lupa. A busca mostra um único carregamento durante a geocodificação e a consulta de clima. É necessário acesso à internet aos endpoints Open-Meteo.

## Verificar e gerar produção

```sh
npm test
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

O preview fica em `http://127.0.0.1:4173/`. O build gera `dist/` com caminhos relativos, pronto para hospedagem estática na raiz ou em um subdiretório. Não é necessário publicar os fontes, testes ou `node_modules`.

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` executa os testes, gera `dist/` e publica o site sempre que há um push para `main`. Para habilitar a publicação, nas configurações do repositório selecione **Settings > Pages > Build and deployment > Source > GitHub Actions**. O endereço do site será `https://douglasonunesinfo.github.io/app-clima-curso/`.

Os testes automatizados usam respostas controladas e DOM simulado. Não substituem inspeção visual, testes de teclado em navegador ou leitor de tela. A situação de aprovação está em [.docs/tasks.md](./.docs/tasks.md), e as evidências finais estão em [.docs/validation.md](./.docs/validation.md).

## Referências

Para conferir o bundle compilado com a API real sem navegador conectado, execute `npm run build` e `npm run verify:production`. Requer internet e usa DOM simulado: verifica os valores renderizados, mas não layout, teclado, CORS ou leitor de tela.

- [PRD](./.docs/prd.md)
- [Tarefas](./.docs/tasks.md)
- [Open-Meteo](https://open-meteo.com/)
