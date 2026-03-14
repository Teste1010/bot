const express = require("express");
const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt"; // Evita duplicados

function lerSaldo() { try { return parseInt(fs.readFileSync(BANCO_DADOS, "utf8")) || 0; } catch (err) { return 0; } }
function salvar(valor) { fs.writeFileSync(BANCO_DADOS, valor.toString()); }

function jaFoiPago(id) {
    try {
        const ids = fs.readFileSync(LOG_PAGAMENTOS, "utf8").split("\n");
        return ids.includes(id.toString());
    } catch (e) { return false; }
}

app.post("/webhook", (req, res) => {
    // Pega qualquer ID que venha na mensagem
    const id = req.body.data?.id || req.body.id || req.body.resource;
    
    console.log("Notificação recebida ID:", id);

    if (id && !jaFoiPago(id)) {
        let saldoAtual = lerSaldo();
        salvar(saldoAtual + 1); // Soma 1 crédito
        fs.appendFileSync(LOG_PAGAMENTOS, id.toString() + "\n"); // Trava esse ID
        console.log("Crédito liberado com sucesso!");
    }

    res.sendStatus(200);
});

app.get("/check", (req, res) => { res.send(lerSaldo().toString()); });
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => { res.send("Servidor Online - Saldo: " + lerSaldo()); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando..."));
