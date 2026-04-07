const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "9C9FF1025FEA65962432BEB6";
const INSTANCE = "3F13882437AD822EC0D1BE4FDF68D33E";

app.post("/webhook", async (req, res) => {
    try {
        console.log("BODY RECEBIDO:", JSON.stringify(req.body, null, 2));

        const mensagem =
            req.body.text?.message ||
            req.body.message ||
            req.body.body ||
            "";

        const numero =
            req.body.phone ||
            req.body.from ||
            req.body.senderPhone ||
            "";

        let resposta = "Digite:\n1 - Comprar\n2 - Revender";

        if (mensagem === "1") {
            resposta = "Perfeito! Você quer comprar. Me diga: uso próprio ou empresa?";
        } else if (mensagem === "2") {
            resposta = "Ótimo! Você quer revender. Já trabalha com material de construção?";
        }

        if (numero) {
            await axios.post(
                `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`,
                {
                    phone: numero,
                    message: resposta
                }
            );
        }

        res.sendStatus(200);
    } catch (error) {
        console.error("ERRO:", error.response?.data || error.message);
        res.sendStatus(500);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));
