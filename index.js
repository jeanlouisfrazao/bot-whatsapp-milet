const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = "9C9FF1025FEA65962432BEB6";
const INSTANCE = "3F13882437AD822EC0D1BE4FDF68D33E";

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

        const numero =
            req.body.phone ||
            req.body.from ||
            req.body.senderPhone ||
            req.body.chatId ||
            "";

        console.log("Mensagem extraída:", mensagem);
        console.log("Número extraído:", numero);

        let resposta = "Digite:\n1 - Comprar\n2 - Revender";

        if (mensagem === "1") {
            resposta = "Perfeito! Você quer comprar. Me diga: uso próprio ou empresa?";
        } else if (mensagem === "2") {
            resposta = "Ótimo! Você quer revender. Já trabalha com material de construção?";
        }

        if (!numero) {
            console.log("Nenhum número encontrado no payload.");
            return res.sendStatus(200);
        }

        const url = `https://api.z-api.io/instances/${INSTANCE}/token/${TOKEN}/send-text`;

        console.log("Enviando resposta para:", numero);

        const retorno = await axios.post(url, {
            phone: numero,
            message: resposta
        });

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
