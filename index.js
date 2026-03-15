const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

// --- CONFIGURAÇÃO ---
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981"; 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

// WEBHOOK (CÓDIGO DO SEU AMIGO COM AJUSTES)
app.post("/webhook", async (req, res) => {
    console.log("Webhook recebido:", JSON.stringify(req.body));

    const paymentId =
        req.body?.data?.id ||
        req.body?.resource?.id ||
        req.body?.id ||
        req.body?.data;

    console.log("ID do pagamento:", paymentId);

    if (!paymentId) {
        res.sendStatus(200);
        return;
    }

    if (!jaPago(paymentId)) {
        try {
            const response = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${ACCESS_TOKEN}`
                    }
                }
            );

            const data = await response.json();

            if (data.status === "approved") {
                const valor = parseFloat(data.transaction_amount);
                let jogadas = 0;

                // Regra de Valor
                if (valor >= 1 && valor < 5) {
                    jogadas = 1; // Teste
                } else {
                    jogadas = Math.floor(valor / 5); // Produção
                }

                if (jogadas > 0) {
                    let saldo = parseInt(ler());
                    saldo += jogadas;
                    salvar(saldo);
                    fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");
                    console.log("Créditos liberados:", jogadas);
                }
            }
        } catch (e) {
            console.log("Erro ao consultar pagamento");
        }
    }
    res.sendStatus(200);
});

// ROTAS DO ARDUINO
app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Grua Online. Saldo: " + ler()));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando!"));
