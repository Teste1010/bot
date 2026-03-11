const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let pagamentosProcessados = {};

// ===== FUNÇÕES DE SALDO =====

const lerCreditos = () => {
    if (!fs.existsSync("creditos.txt")) return 0;
    return parseInt(fs.readFileSync("creditos.txt", "utf8")) || 0;
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toString());
};

// ===== PAGINA INICIAL =====

app.get("/", (req, res) => {
    res.send("BOT ONLINE");
});

// ===== WEBHOOK MERCADO PAGO =====

app.post("/webhook", async (req, res) => {

    const paymentId = req.body.data?.id || req.body.resource || req.body.id;

    if (!paymentId) return res.sendStatus(200);

    if (pagamentosProcessados[paymentId]) {
        return res.sendStatus(200);
    }

    pagamentosProcessados[paymentId] = true;

    try {

        const resposta = await fetch(
            https://api.mercadopago.com/v1/payments/${paymentId},
            {
                method: "GET",
                headers: {
                    Authorization: Bearer ${ACCESS_TOKEN},
                },
            }
        );

        const pagamento = await resposta.json();

        if (pagamento.status === "approved") {

            const valorPago = parseFloat(pagamento.transaction_amount);

            const creditos = Math.floor(valorPago);

            let total = lerCreditos();

            total += creditos;

            salvarCreditos(total);

            console.log("Pagamento aprovado");
            console.log("Créditos adicionados:", creditos);
            console.log("Total:", total);
        }

    } catch (erro) {

        console.log("Erro webhook:", erro);

    }

    res.sendStatus(200);
});

// ===== ADICIONAR CREDITOS MANUAL (DINHEIRO) =====

app.get("/add/:valor", (req, res) => {

    const valor = Number(req.params.valor);

    if (isNaN(valor)) {
        return res.send("valor invalido");
    }

    let total = lerCreditos();

    total += valor;

    salvarCreditos(total);

    res.send("OK");
});

// ===== ESP32 CONSULTA CREDITOS =====

app.get("/check", (req, res) => {

    let creditos = lerCreditos();

    console.log("Créditos atuais:", creditos);

    if (creditos >= 5) {

        res.send("5");

    } else {

        res.send("0");

    }

});

// ===== ESP32 CONFIRMA JOGADA =====

app.get("/consumir", (req, res) => {

    let creditos = lerCreditos();

    if (creditos >= 5) {

        creditos -= 5;

        salvarCreditos(creditos);

        console.log("Jogada realizada");

        res.send("ok");

    } else {

        res.send("erro");

    }

});

// ===== SERVIDOR =====

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("Servidor rodando");

});
