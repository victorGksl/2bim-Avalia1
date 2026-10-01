// script.js
// A pagina apenas faz login com o Google, envia o numero e o id_token para
// /api/desenho e exibe o SVG devolvido pelo servidor.

// Client ID do OAuth (Web application) criado no Google Cloud Console.
// O Client ID e publico; pode ficar no repositorio.
const GOOGLE_CLIENT_ID = "811495618009-jip2ni2l9hmt6cjkc3gnlufm0e0fbvi5.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const usuario = document.getElementById("usuario");
const botaoBaixar = document.getElementById("baixar");
const botaoDesenhar = document.getElementById("desenhar");

let idToken = "";
let svgAtual = "";

function mostrarErro(texto) {
  mensagem.textContent = texto;
}

function lerEmailDoToken(token) {
  // Apenas para exibir quem esta logado. A verificacao real e feita no servidor.
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json).email || "";
  } catch {
    return "";
  }
}

function aoLogar(resposta) {
  idToken = resposta.credential;
  const email = lerEmailDoToken(idToken);
  usuario.textContent = email ? `Conectado como ${email}` : "Conectado";
  mostrarErro("");
}

function iniciarGoogle() {
  if (!window.google || !google.accounts || !google.accounts.id) {
    setTimeout(iniciarGoogle, 200);
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: aoLogar,
  });
  google.accounts.id.renderButton(document.getElementById("login"), {
    theme: "filled_black",
    size: "large",
    text: "signin_with",
    locale: "pt-BR",
  });
}

iniciarGoogle();

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mostrarErro("");

  const valor = campoNumero.value.trim();
  const numero = valor === "" ? null : Number(valor);

  const cabecalhos = { "Content-Type": "application/json" };
  if (idToken) cabecalhos.Authorization = `Bearer ${idToken}`;

  botaoDesenhar.disabled = true;
  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mostrarErro("Número inválido. Digite um inteiro entre 1 e 100.");
      return;
    }
    if (resposta.status === 401) {
      mostrarErro("Não autorizado. Faça login com o Google (ou entre novamente) e tente de novo.");
      return;
    }
    if (!resposta.ok) {
      mostrarErro(`Erro inesperado do servidor (${resposta.status}).`);
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch {
    mostrarErro("Falha de rede ao falar com o servidor.");
  } finally {
    botaoDesenhar.disabled = false;
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
