const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =========================
// CONFIGURAÇÕES Z-API
// =========================
const TOKEN = "9C9FF1025FEA65962432BEB6";
const INSTANCE = "3F13882437AD822EC0D1BE4FDF68D33E";
const CLIENT_TOKEN = "Ff8c308284ffb498e9a8bf1c62663eae1S";

// =========================
// MEMÓRIA SIMPLES
// =========================
const estados = {};

// =========================
// FUNÇÕES AUXILIARES
// =========================
function menuPrincipal() {
    return `Oi! Tudo bem? 😊
Seja bem-vindo à Milet Representações!

Trabalhamos com marcas referência no mercado de construção como Cetilux, Colortex, Ecomex, Embramaco, Ravello e Sika — só produto de confiança.

Pode ficar à vontade pra me dizer seu nome e o que você precisa, vou te ajudar no primeiro momento e te passar para um atendente assim que finalizarmos 👍:

1 - Quero comprar
2 - Pós venda
3 - Catálogo`;
}

function normalizarTexto(texto) {
    return (texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function ehOpcaoComprar(texto) {
    const t = normalizarTexto(texto);
    return t === "1" || t.includes("quero comprar") || t === "comprar" || t.includes("comprar produto");
}

function ehOpcaoPosVenda(texto) {
    const t = normalizarTexto(texto);
    return t === "2" || t.includes("pos venda") || t.includes("pós venda") || t === "pos-venda" || t === "pós-venda";
}

function ehOpcaoCatalogo(texto) {
    const t = normalizarTexto(texto);
    return t === "3" || t.includes("catalogo") || t.includes("catálogo");
}

// =========================
// TESTE
// =========================
app.get("/", (req, res) => {
    res.send("Bot online");
});

// =========================
// WEBHOOK
// =========================
app.post("/webhook", async (req, res) => {
    try {
        const mensagem =
            req.body.text?.message ||
            req.body.message ||
            req.body.body ||
            req.body.text ||
            "";

        let numero =
            req.body.phone ||
            req.body.from ||
            req.body.senderPhone ||
            req.body.chatId ||
            "";

        if (typeof numero === "string") {
            numero = numero.replace("@c.us", "").replace("@s.whatsapp.net", "");
        }

        const mensagemNormalizada = normalizarTexto(mensagem);
        let resposta = "";

        if (!numero) {
            return res.sendStatus(200);
        }

        if (!estados[numero]) {
            estados[numero] = "menu";
        }

        if (["menu", "oi", "ola", "olá", "inicio", "início"].includes(mensagemNormalizada)) {
            estados[numero] = "menu";
            resposta = menuPrincipal();
        } else if (estados[numero] === "menu") {
            if (ehOpcaoComprar(mensagem)) {
                resposta = `Perfeito! 👍

Vou te direcionar agora para nosso especialista em compras.

👉 Clique aqui para continuar:
https://wa.me/557998001600?text=Olá,%20vim%20pelo%20atendimento%20da%20Milet%20e%20quero%20comprar

Se não abrir automaticamente, é só clicar no link acima 👆`;
            } else if (ehOpcaoPosVenda(mensagem)) {
                resposta = `Perfeito! 👍

Vou te direcionar agora para nosso suporte de pós-venda.

👉 Clique aqui para continuar:
https://wa.me/5579998443474?text=Olá,%20vim%20pelo%20atendimento%20da%20Milet%20e%20preciso%20de%20pós%20venda

Se não abrir automaticamente, é só clicar no link acima 👆`;
            } else if (ehOpcaoCatalogo(mensagem)) {
                resposta = `Claro! 📁

Segue nosso catálogo para download:
https://drive.google.com/drive/folders/1C4Cp1fl-uWhF0iq9BO3fBH81AUUvUAIV?usp=sharing

Se precisar de ajuda para encontrar o produto ideal, me chama aqui 👍`;
            } else {
                resposta = menuPrincipal();
            }
        } else {
            estados[numero] = "menu";
            resposta = menuPrincipal();
        }

        const url = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`;

        await axios.post(
            url,
            {
                phone: numero,
                message: resposta
            },
            {
                headers: {
                    "Client-Token": CLIENT_TOKEN
                }
            }
        );

        res.sendStatus(200);
    } catch (error) {
        console.error("ERRO:", error.response?.data || error.message);
        res.sendStatus(500);
    }
});

// =========================
// SERVIDOR
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
