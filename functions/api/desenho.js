// functions/api/desenho.js
// Pages Function: POST /api/desenho
//
// Contrato:
//   405 -> metodo diferente de POST
//   400 -> corpo ausente, JSON invalido, numero ausente, nao inteiro ou fora de 1..100
//   401 -> token ausente, invalido, expirado, aud diferente do Client ID ou e-mail nao verificado
//   200 -> SVG (image/svg+xml) assinado com o e-mail do token
//
// Ordem das verificacoes: metodo (405), corpo (400), token (401).

import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

const TOKENINFO = "https://oauth2.googleapis.com/tokeninfo?id_token=";

function erro(status, texto, extras = {}) {
  return new Response(JSON.stringify({ erro: texto }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extras,
    },
  });
}

async function lerNumero(request) {
  let texto;
  try {
    texto = await request.text();
  } catch {
    return null;
  }
  if (!texto || texto.trim() === "") return null;

  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return null;
  }
  if (dados === null || typeof dados !== "object" || Array.isArray(dados)) {
    return null;
  }
  if (!numeroValido(dados.numero)) return null;
  return dados.numero;
}

async function verificarToken(request, env) {
  const cabecalho = request.headers.get("Authorization") || "";
  const partes = cabecalho.trim().split(/\s+/);
  if (partes.length !== 2 || partes[0].toLowerCase() !== "bearer" || !partes[1]) {
    return null;
  }
  const token = partes[1];

  const clientId = env && env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;

  let resposta;
  try {
    resposta = await fetch(TOKENINFO + encodeURIComponent(token));
  } catch {
    return null;
  }
  if (resposta.status !== 200) return null;

  let info;
  try {
    info = await resposta.json();
  } catch {
    return null;
  }

  if (info.aud !== clientId) return null;
  if (String(info.email_verified) !== "true") return null;
  if (info.exp && Number(info.exp) * 1000 < Date.now()) return null;
  if (typeof info.email !== "string" || info.email === "") return null;

  return info.email;
}

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Metodo
  if (request.method !== "POST") {
    return erro(405, "Metodo nao permitido. Use POST.", { Allow: "POST" });
  }

  // 2. Corpo
  const numero = await lerNumero(request);
  if (numero === null) {
    return erro(400, "Envie um JSON no formato {\"numero\": N}, com N inteiro entre 1 e 100.");
  }

  // 3. Token
  const email = await verificarToken(request, env);
  if (email === null) {
    return erro(401, "Token ausente, invalido ou expirado. Faca login com o Google novamente.");
  }

  const svg = gerarDesenho(numero, email);
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
