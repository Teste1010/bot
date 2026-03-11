const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let pagamentosProcessados = {};

// Função para ler saldo (agora lendo como número decimal)
const lerCreditos = () => {
    try {
        if (!fs.existsSync("creditos.txt")) return 0;
        const dado = fs.readFileSync("creditos.txt", "utf8");
        return parseFloat(dado) || 0;
    } catch (e) { return 0; }
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toFixed(2));
};

app.get("/", (req, res) => res.send("Servidor Grua Ativo"));

// WEBHOOK MERCADO PAGO
app.post("/webhook", async (req, res) => {
    const paymentId = req.body.data?.id || req.body.resource || req.body.id;
    if (!paymentId || pagamentosProcessados[paymentId]) return res.sendStatus(200);

    pagamentosProcessados[paymentId] = true;

    try {
        const resposta = await fetch(https://api.mercadopago.com/v1/payments/${paymentId}, {
            method: "GET",
            headers: { Authorization: Bearer ${ACCESS_TOKEN} }
        });

        if (resposta.ok) {
            const pagamento = await resposta.json();
            if (pagamento.status === "approved") {
                const valorPago = parseFloat(pagamento.transaction_amount);
                let total = lerCreditos();
                total += valorPago;
                salvarCreditos(total);
                console.log(Sucesso: R$ ${valorPago} adicionados. Total: ${total});
            }
        }
    } catch (erro) {
        console.log("Erro ao processar pagamento:", erro);
    }
    res.sendStatus(200);
});

// ADICIONAR DINHEIRO DE PAPEL (R$ 1,00 = 1.00)
app.get("/add/:valor", (req, res) => {
    const valor = parseFloat(req.params.valor);
    if (isNaN(valor)) return res.send("Erro: Valor inválido");

    let total = lerCreditos();
    total += valor;
    salvarCreditos(total);
    res.send("OK");
});

// ESP32 CONSULTA SE TEM R$ 5,00 OU MAIS
app.get("/check", (req, res) => {
    let total = lerCreditos();
    if (total >= 5) {
        res.send("5"); // Avisa o ESP32 que pode jogar
    } else {
        res.send("0");
    }
});

// ESP32 AVISA QUE A JOGADA OCORREU E DESCONTA R$ 5,00
app.get("/consumir", (req, res) => {
    let total = lerCreditos();
    if (total >= 5) {
        total -= 5;
        salvarCreditos(total);
        res.send("ok");
    } else {
        res.send("erro");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log(Servidor rodando na porta ${PORT}));
