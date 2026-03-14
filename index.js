const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "pagamentos_processados.txt"; // Para evitar duplicados

function lerSaldo() { try { return parseInt(fs.readFileSync(BANCO_DADOS, "utf8")) || 0; } catch (err) { return 0; } }
function salvar(valor) { fs.writeFileSync(BANCO_DADOS, valor.toString()); }

// Função para evitar que o mesmo pagamento conte duas vezes
function pagamentoJaProcessado(id) {
    try {
        const ids = fs.readFileSync(LOG_PAGAMENTOS, "utf8").split("\n");
        return ids.includes(id.toString());
    } catch (err) { return false; }
}
function registrarPagamento(id) { fs.appendFileSync(LOG_PAGAMENTOS, id.toString() + "\n"); }

app.post("/webhook", (req, res) => {
    // Pegamos o ID e o Valor do pagamento enviado pelo Mercado Pago
    const idPagamento = req.body.data ? req.body.data.id : (req.body.resource || req.body.id);
    const valorPago = req.body.transaction_amount || req.body.amount || 0;

    console.log(`Recebido: ID ${idPagamento} - Valor: R$ ${valorPago}`);

    // Se não tiver ID ou se já processamos esse ID antes, a gente ignora
    if (!idPagamento || pagamentoJaProcessado(idPagamento)) {
        return res.sendStatus(200);
    }

    let creditos = 0;

    // DEFINA SEUS PREÇOS AQUI:
    if (valorPago >= 5.00) {
        creditos = 5; // Se pagar 5 ou mais, ganha 5 jogadas
    } else if (valorPago >= 1.00) {
        creditos = 1; // Se pagar entre 1 e 4.99, ganha 1 jogada
    }

    if (creditos > 0) {
        let saldoAtual = lerSaldo();
        salvar(saldoAtual + creditos);
        registrarPagamento(idPagamento); // Marca como pago para não repetir
        console.log(`Sucesso: Adicionado ${creditos} créditos.`);
    }

    res.sendStatus(200);
});

app.get("/check", (req, res) => { res.send(lerSaldo().toString()); });
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => { res.send("Sistema Grua Online. Saldo: " + lerSaldo()); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));
