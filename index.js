const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let pagamentosProcessados = {};

// ===== FUNÇÕES DE SALDO =====
const lerCreditos = () => {
    try {
        if (!fs.existsSync("creditos.txt")) return 0;
        return parseInt(fs.readFileSync("creditos.txt", "utf8")) || 0;
    } catch (e) { return 0; }
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toString());
};

// ===== PAGINA INICIAL =====
app.get("/", (req, res) => {
    res.send("BOT GRUA ONLINE");
});

// ===== WEBHOOK MERCADO PAGO =====
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
            const creditosParaAdicionar = Math.floor(valorPago); // Pega só o valor inteiro

            let total = lerCreditos();
            total += creditosParaAdicionar;
            salvarCreditos(total);

            console.log("Pagamento aprovado. Total agora:", total);
        }
    } catch (erro) {
        console.log("Erro no webhook:", erro);
    }
    res.sendStatus(200);
});

// ===== ADICIONAR CREDITOS MANUAL (DINHEIRO DE PAPEL) =====
app.get("/add/:valor", (req, res) => {
    const valor = parseInt(req.params.valor);
    if (isNaN(valor)) return res.send("valor invalido");

    let total = lerCreditos();
    total += valor;
    salvarCreditos(total);
    res.send("OK");
});

// ===== ESP32 CONSULTA SE TEM 5 CREDITOS =====
app.get("/check", (req, res) => {
    let creditos = lerCreditos();
    if (creditos >= 5) {
        res.send("5");
    } else {
        res.send("0");
    }
});

// ===== ESP32 CONFIRMA JOGADA E DESCONTA 5 =====
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
app.listen(PORT, "0.0.0.0", () => {
    console.log("Servidor rodando na porta " + PORT);
});
