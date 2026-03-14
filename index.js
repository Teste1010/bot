const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const BANCO_DADOS = "saldo.txt";

// Função para ler o saldo atual
function lerSaldo() {
    try {
        return parseInt(fs.readFileSync(BANCO_DADOS, "utf8")) || 0;
    } catch (err) {
        return 0;
    }
}

// Função para salvar o saldo
function salvar(valor) {
    fs.writeFileSync(BANCO_DADOS, valor.toString());
}

// ROTA DO WEBHOOK (O Mercado Pago avisa aqui)
app.post("/webhook", (req, res) => {
    console.log("Notificação recebida!");
    
    // Lógica para somar crédito (acumulativo)
    let saldoAtual = lerSaldo();
    salvar(saldoAtual + 1); // Soma +1 crédito a cada aviso de pagamento
    
    res.sendStatus(200); // Avisa ao Mercado Pago que recebemos
});

// ROTA PARA O ESP32 CONSULTAR O SALDO
app.get("/check", (req, res) => {
    res.send(lerSaldo().toString());
});

// ROTA PARA O ESP32 ZERAR O SALDO APÓS BATER O RELÉ
app.get("/consumir", (req, res) => {
    salvar(0);
    res.send("0");
});

// ROTA DE TESTE (Para você testar pelo navegador sem pagar)
app.get("/teste", (req, res) => {
    let saldoAtual = lerSaldo();
    salvar(saldoAtual + 1);
    res.send("Você enviou 1 crédito manual! Saldo atual: " + (saldoAtual + 1));
});

app.get("/", (req, res) => {
    res.send("Servidor da Grua Online! Saldo: " + lerSaldo());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
