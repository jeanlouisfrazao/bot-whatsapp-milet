const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "9C9FF1025FEA65962432BEB6";
const INSTANCE = "3F13882437AD822EC0D1BE4FDF68D33E";
const CLIENT_TOKEN = "Ff8c308284ffb498e9a8bf1c62663eae1S";

app.get("/", (req, res) => {
    res.send("Bot online");
});

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

        let resposta = "Digite:\n1 - Comprar\n2 - Revender";

        if (mensagem === "1") {
            resposta = "Perfeito! Você quer comprar. Me diga: uso próprio ou empresa?";
        } else if (mensagem === "2") {
            resposta = "Ótimo! Você quer revender. Já trabalha com material de construção?";
        }

        if (!numero) {
            return res.sendStatus(200);
        }

        const url = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`;

        const retorno = await axios.post(
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

        console.log("Resposta da Z-API:", retorno.data);
        res.sendStatus(200);
    } catch (error) {
        console.error("ERRO COMPLETO:");
        console.error(error.response?.data || error.message);
        res.sendStatus(500);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
