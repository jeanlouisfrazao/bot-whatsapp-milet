const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

// =============================
// CONFIGURAÇÕES
// =============================
const TOKEN = "9C9FF1025FEA65962432BEB6";
const INSTANCE = "3F13882437AD822EC0D1BE4FDF68D33E";
const CLIENT_TOKEN = "Ff8c308284ffb498e9a8bf1c62663eae1S";

// OpenAI via variável do Railway
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =============================
// MEMÓRIA SIMPLES
// =============================
const estados = {};
const historico = {};

// =============================
// FUNÇÕES AUXILIARES
// =============================
function menuPrincipal() {
    return `Olá! 👋 Bem-vindo à Milet Representações.

Trabalhamos com as melhores marcas de material de construção como Sika, Ravello, Embramaco e muito mais.

Me diz rapidinho como posso te ajudar:

1 - Quero comprar produtos
2 - Quero revender
3 - Falar com um vendedor
4 - Ver catálogo

Se preferir, também pode me escrever sua dúvida normalmente.`;
}

function normalizarNumero(numero) {
    if (!numero) return "";
    if (typeof numero !== "string") return numero;

    return numero
        .replace("@c.us", "")
        .replace("@s.whatsapp.net", "")
        .trim();
}

function inicializarHistorico(numero) {
    if (!historico[numero]) {
        historico[numero] = [
            {
                role: "system",
                content: `Você é um atendente comercial da Milet Representações.

Sua função é:
- atender com educação, clareza e objetividade
- ajudar clientes com dúvidas sobre materiais de construção
- conduzir o cliente para compra, catálogo ou atendimento humano
- responder como um vendedor consultivo, sem parecer robótico

Diretrizes:
- seja direto e simpático
- não invente estoque, preço ou prazo se não souber
- quando o cliente quiser comprar, entender a necessidade dele
- quando o cliente quiser revender, tratar como potencial parceiro comercial
- quando o cliente pedir catálogo, orientar que pode receber catálogo
- quando o cliente pedir vendedor, orientar que um vendedor pode continuar o atendimento
- mantenha respostas curtas, úteis e comerciais
- use português do Brasil`
            }
        ];
    }
}

async function responderIA(numero, mensagem) {
    inicializarHistorico(numero);

    historico[numero].push({
        role: "user",
        content: mensagem
    });

    const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: historico[numero]
    });

    const texto = resposta.choices[0].message.content;

    historico[numero].push({
        role: "assistant",
        content: texto
    });

    // evita crescimento infinito
    if (historico[numero].length > 12) {
        historico[numero] = [
            historico[numero][0],
            ...historico[numero].slice(-10)
        ];
    }

    return texto;
}

async function enviarMensagem(numero, mensagem) {
    const url = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`;

    return axios.post(
        url,
        {
            phone: numero,
            message: mensagem
        },
        {
            headers: {
                "Client-Token": CLIENT_TOKEN
            }
        }
    );
}

// =============================
// ROTA DE TESTE
// =============================
app.get("/", (req, res) => {
    res.send("Bot online");
});

// =============================
// WEBHOOK PRINCIPAL
// =============================
app.post("/webhook", async (req, res) => {
    try {
        console.log("BODY RECEBIDO:", JSON.stringify(req.body, null, 2));

        const mensagemRecebida =
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

        numero = normalizarNumero(numero);

        const mensagem = String(mensagemRecebida).trim().toLowerCase();

        console.log("Mensagem:", mensagem);
        console.log("Número:", numero);

        if (!numero) {
            console.log("Número não encontrado no payload.");
            return res.sendStatus(200);
        }

        let resposta = "";

        if (!estados[numero]) {
            estados[numero] = "menu";
        }

        // comando universal para reiniciar fluxo
        if (["menu", "início", "inicio", "voltar", "reiniciar"].includes(mensagem)) {
            estados[numero] = "menu";
            resposta = menuPrincipal();
            await enviarMensagem(numero, resposta);
            return res.sendStatus(200);
        }

        // =============================
        // MENU PRINCIPAL
        // =============================
        if (estados[numero] === "menu") {
            if (mensagem === "1") {
                estados[numero] = "comprar_tipo";
                resposta = `Perfeito! 👍

Você está comprando para:

1 - Uso próprio
2 - Empresa`;
            } else if (mensagem === "2") {
                estados[numero] = "revenda_inicio";
                resposta = `Ótimo! 🚀

Você já trabalha com material de construção?

1 - Sim
2 - Não`;
            } else if (mensagem === "3") {
                estados[numero] = "aguardando_vendedor";
                resposta = `Perfeito 👍

Me envie seu nome e sua cidade para eu te conectar com um vendedor.`;
            } else if (mensagem === "4") {
                estados[numero] = "aguardando_catalogo";
                resposta = `Claro! 📦

Me envie seu nome e sua cidade que seguimos com o catálogo e o atendimento.`;
            } else if (mensagem === "oi" || mensagem === "olá" || mensagem === "ola" || mensagem === "bom dia" || mensagem === "boa tarde" || mensagem === "boa noite") {
                resposta = menuPrincipal();
            } else {
                resposta = await responderIA(numero, mensagemRecebida);
            }
        }

        // =============================
        // FLUXO COMPRA
        // =============================
        else if (estados[numero] === "comprar_tipo") {
            if (mensagem === "1") {
                estados[numero] = "uso_proprio";
                resposta = `Show! 👌

O que você precisa?

1 - Resolver infiltração
2 - Argamassa / assentamento
3 - Revestimento / acabamento
4 - Outro`;
            } else if (mensagem === "2") {
                estados[numero] = "empresa";
                resposta = `Perfeito 👷‍♂️

Você busca:

1 - Compra em volume
2 - Fornecedor fixo
3 - Produto específico`;
            } else {
                resposta = `Responda com uma opção:

1 - Uso próprio
2 - Empresa

Ou digite "menu" para voltar ao início.`;
            }
        }

        else if (estados[numero] === "uso_proprio") {
            if (mensagem === "1") {
                estados[numero] = "menu";
                resposta = `Para casos de infiltração, podemos te orientar na linha de impermeabilização e solução adequada para a necessidade.

Se quiser, me diga:
- onde está a infiltração
- se é parede, laje, piso ou área externa

Ou me envie seu nome e cidade para seguirmos com um vendedor.`;
            } else if (mensagem === "2") {
                estados[numero] = "menu";
                resposta = `Perfeito. Para argamassa e assentamento, consigo te orientar melhor se você me disser:

- área interna ou externa
- piso, parede ou porcelanato
- tamanho aproximado da obra

Se preferir, me envie seu nome e cidade para seguirmos com um vendedor.`;
            } else if (mensagem === "3") {
                estados[numero] = "menu";
                resposta = `Ótimo. Para revestimento e acabamento, me diga:

- qual ambiente
- tipo de revestimento desejado
- se é reforma ou obra nova

Se preferir, me envie seu nome e cidade para continuarmos o atendimento.`;
            } else if (mensagem === "4") {
                estados[numero] = "menu";
                resposta = `Sem problema 👍

Me explique o que você precisa e eu te ajudo a encontrar a melhor solução.`;
            } else {
                resposta = await responderIA(numero, mensagemRecebida);
            }
        }

        else if (estados[numero] === "empresa") {
            if (mensagem === "1") {
                estados[numero] = "menu";
                resposta = `Perfeito. Para compra em volume, me envie:

- nome
- cidade
- tipo de material que busca

Assim conseguimos seguir com atendimento comercial.`;
            } else if (mensagem === "2") {
                estados[numero] = "menu";
                resposta = `Excelente. Se você busca fornecedor fixo, podemos continuar com atendimento comercial.

Me envie:
- nome
- empresa
- cidade
- principais produtos de interesse`;
            } else if (mensagem === "3") {
                estados[numero] = "menu";
                resposta = `Perfeito. Me diga qual produto específico você está procurando e eu sigo com você no atendimento.`;
            } else {
                resposta = `Responda com uma opção:

1 - Compra em volume
2 - Fornecedor fixo
3 - Produto específico

Ou digite "menu" para voltar ao início.`;
            }
        }

        // =============================
        // FLUXO REVENDA
        // =============================
        else if (estados[numero] === "revenda_inicio") {
            if (mensagem === "1") {
                estados[numero] = "menu";
                resposta = `Excelente! Podemos seguir com atendimento comercial para revenda.

Me envie:
- nome
- empresa ou loja
- cidade
- principais linhas de interesse

Assim avançamos melhor.`;
            } else if (mensagem === "2") {
                estados[numero] = "menu";
                resposta = `Top! Esse mercado tem muita oportunidade 👍

Me envie:
- nome
- cidade
- se pretende abrir loja, revender online ou atuar em outro formato

Assim conseguimos te orientar melhor.`;
            } else {
                resposta = `Responda com uma opção:

1 - Sim
2 - Não

Ou digite "menu" para voltar ao início.`;
            }
        }

        // =============================
        // VENDEDOR / CATÁLOGO
        // =============================
        else if (estados[numero] === "aguardando_vendedor") {
            estados[numero] = "menu";
            resposta = `Perfeito 👍

Recebi suas informações. Agora seguimos com atendimento para conexão com vendedor.

Se quiser, já pode me adiantar qual produto ou necessidade você procura.`;
        }

        else if (estados[numero] === "aguardando_catalogo") {
            estados[numero] = "menu";
            resposta = `Perfeito 📦

Recebi suas informações. Seguimos agora com catálogo e atendimento conforme sua necessidade.

Se quiser, já me diga o tipo de produto que você procura.`;
        }

        // =============================
        // FALLBACK GERAL
        // =============================
        else {
            estados[numero] = "menu";
            resposta = await responderIA(numero, mensagemRecebida);
        }

        console.log("Resposta enviada:", resposta);

        await enviarMensagem(numero, resposta);

        return res.sendStatus(200);
    } catch (error) {
        console.error("ERRO COMPLETO:");
        console.error(error.response?.data || error.message);
        return res.sendStatus(500);
    }
});

// =============================
// SERVIDOR
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
