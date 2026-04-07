const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

// 🔐 CONFIGURAÇÕES Z-API
const TOKEN = "9C9FF1025FEA65962432BEB6";
const INSTANCE = "3F13882437AD822EC0D1BE4FDF68D33E";
const CLIENT_TOKEN = "Ff8c308284ffb498e9a8bf1c62663eae1S";

// 🤖 CONFIGURAÇÃO OPENAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// 🧠 MEMÓRIA DE CONVERSA
const estados = {};

// 📋 MENU PRINCIPAL
function menuPrincipal() {
    return `Olá! 👋 Bem-vindo à Milet Representações.

Trabalhamos com as melhores marcas de material de construção como Sika, Ravello, Embramaco e muito mais.

Me diz rapidinho como posso te ajudar:

1️⃣ Quero comprar produtos
2️⃣ Quero revender
3️⃣ Falar com um vendedor
4️⃣ Ver catálogo`;
}

// 🤖 FUNÇÃO IA
async function responderIA(mensagem) {
    const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "Você é um atendente da Milet Representações, especialista em materiais de construção. Seja direto, educado e conduza para venda."
            },
            {
                role: "user",
                content: mensagem
            }
        ]
    });

    return resposta.choices[0].message.content;
}

// 🟢 ROTA TESTE
app.get("/", (req, res) => {
    res.send("Bot online");
});

// 🔥 WEBHOOK PRINCIPAL
app.post("/webhook", async (req, res) => {
    try {
        console.log("BODY RECEBIDO:", JSON.stringify(req.body, null, 2));

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

        console.log("Mensagem:", mensagem);
        console.log("Número:", numero);

        let resposta = "";

        // 🧠 INICIALIZA ESTADO
        if (!estados[numero]) {
            estados[numero] = "menu";
        }

        // 🎯 MENU PRINCIPAL
        if (estados[numero] === "menu") {
            if (mensagem === "1") {
                estados[numero] = "comprar_tipo";
                resposta = "Perfeito! 👍\nVocê está comprando para:\n1 - Uso próprio\n2 - Empresa";
            } 
            else if (mensagem === "2") {
                estados[numero] = "revenda_inicio";
                resposta = "Ótimo! 🚀\nVocê já trabalha com material de construção?\n1 - Sim\n2 - Não";
            } 
            else if (mensagem === "3") {
                estados[numero] = "vendedor";
                resposta = "Perfeito 👍\nMe envia seu nome e cidade que vou te conectar com um vendedor.";
            } 
            else if (mensagem === "4") {
                estados[numero] = "catalogo";
                resposta = "Claro! 📦\nVou te enviar nosso catálogo. Se quiser ajuda pra escolher, me chama 👍";
            } 
            else {
                resposta = menuPrincipal();
            }
        }

        // 🧱 COMPRA
        else if (estados[numero] === "comprar_tipo") {
            if (mensagem === "1") {
                estados[numero] = "uso_proprio";
                resposta = "Show! 👌\nO que você precisa?\n1 - Infiltração\n2 - Argamassa\n3 - Revestimento\n4 - Outro";
            } 
            else if (mensagem === "2") {
                estados[numero] = "empresa";
                resposta = "Perfeito 👷‍♂️\nVocê busca:\n1 - Compra em volume\n2 - Fornecedor fixo\n3 - Produto específico";
            } 
            else {
                resposta = "Responda:\n1 - Uso próprio\n2 - Empresa";
            }
        }

        // 🏗️ REVENDA
        else if (estados[numero] === "revenda_inicio") {
            if (mensagem === "1") {
                resposta = "Excelente! Podemos te ajudar a aumentar sua margem. Quer falar com um consultor?";
            } 
            else if (mensagem === "2") {
                resposta = "Top! Esse mercado tem muita oportunidade. Vou te direcionar para um especialista.";
            } 
            else {
                resposta = "Responda:\n1 - Sim\n2 - Não";
            }
        }

        // 🤖 FALLBACK COM IA
        else {
            resposta = await responderIA(mensagem);
        }

        // 🚨 ENVIO Z-API
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

// 🚀 SERVIDOR
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
             
