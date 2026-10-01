# Desenho Assinado

Página que recebe um número inteiro entre 1 e 100 e devolve uma figura em SVG, assinada com um e-mail.

A figura é a tabuada modular no círculo: 240 pontos igualmente espaçados numa circunferência, com cada ponto `i` ligado ao ponto `(k * i) mod 240`, em que `k = número + 1`. O número 1 produz uma cardioide, o 2 uma nefroide, e cada valor gera uma figura diferente.

## Estrutura

O desenho é gerado no servidor por uma Pages Function. A assinatura é o e-mail da conta Google usada no login, obtido pelo servidor a partir do `id_token` verificado em `https://oauth2.googleapis.com/tokeninfo`.

```
public/
  index.html             formulário com o número e o botão de login do Google
  style.css              aparência da página
  script.js              envia número e token para /api/desenho e exibe o SVG
lib/
  desenho.js             gera o SVG (função pura, sem DOM) - não é servido ao público
functions/
  api/desenho.js         Pages Function: POST /api/desenho
evidencias/
  exemplo.svg            desenho gerado pelo site publicado
```

## Contrato da API

`POST /api/desenho` com corpo `{"numero": 42}` e cabeçalho `Authorization: Bearer <id_token>`.

| Status | Situação |
|--------|----------|
| 200 | SVG (`image/svg+xml`) assinado com o e-mail do token |
| 400 | Corpo ausente, JSON inválido, `numero` ausente, não inteiro ou fora de 1 a 100 |
| 401 | Token ausente, inválido, expirado, `aud` diferente do Client ID ou e-mail não verificado |
| 405 | Método diferente de POST |

Variável de ambiente no Cloudflare Pages: `GOOGLE_CLIENT_ID`.

## Publicação no Cloudflare Pages

Framework preset: `None`. Build command: vazio. Build output directory: `public`.

## Identificação (preencha após o fork)

Nome: Victor Gabriel Kovalski de Barros
RA: 202610837
URL: https://
