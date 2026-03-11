const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();

app.use(express.json());

// ⚠️ COLOQUE SEU TOKEN DO MERCADO PAGO AQUI
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let pagamentosProcessados = {};

const lerCreditos = () => {
    try {
        if (!fs.existsSync("creditos.txt")) return 0;
        return parseInt(fs.readFileSync("creditos.txt", "utf8")) || 0;
    } catch (e) { return 0; }
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toString());
};

app.get("/", (req, res) => res.send("BOT GRUA ONLINE"));

app.post("/webhook", async (req, res) => {
    const paymentId = req.body.data?.id || req.body.resource || req.body.id;
    if (!paymentId || pagamentosProcessados[paymentId]) return res.sendStatus(200);

    pagamentosProcessados[paymentId] = true;

    try {
        const resposta = await fetch(https://api.mercadopago.com/v1/payments/${paymentId}, {
            method: "GET",
            headers: { Authorization: Bearer ${ACCESS_TOKEN} }
        });

        const pagamento = await resposta.json();

        if (pagamento.status === "approved") {
            const valorPago = parseFloat(pagamento.transaction_amount);
            const creditos = Math.floor(valorPago);
            let total = lerCreditos();
            total += creditos;
            salvarCreditos(total);
            console.log("Pagamento aprovado. Total:", total);
        }
    } catch (erro) {
        console.log("Erro no webhook:", erro);
    }
    res.sendStatus(200);
});

app.get("/add/:valor", (req, res) => {
    const valor = parseInt(req.params.valor);
    if (isNaN(valor)) return res.send("valor invalido");
    let total = lerCreditos();
    total += valor;
    salvarCreditos(total);
    res.send("OK");
});

app.get("/check", (req, res) => {
    let creditos = lerCreditos();
    res.send(creditos >= 5 ? "5" : "0");
});

app.get("/consumir", (req, res) => {
    let creditos = lerCreditos();
    if (creditos >= 5) {
        creditos -= 5;
        salvarCreditos(creditos);
        res.send("ok");
    } else {
        res.send("erro");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Servidor rodando"));
