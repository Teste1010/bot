const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

// --- COLOQUE SEU TOKEN ABAIXO ---
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981"; 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

function lerSaldo() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvarSaldo(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaProcessado(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

app.post("/webhook", async (req, res) => {
    const paymentId = req.body.data?.id || req.body.id;
    
    if (paymentId && !jaProcessado(paymentId)) {
        try {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            const data = await response.json();

            if (data.status === "approved") {
                const valor = parseFloat(data.transaction_amount);
                
                let creditos = 0;
                // Se for 1 real (teste), dá 1 crédito. 
                // Se for 5 ou mais, usa a regra de R$ 5 por jogada.
                if (valor >= 1.00 && valor < 5.00) {
                    creditos = 1; 
                } else {
                    creditos = Math.floor(valor / 5);
                }

                if (creditos > 0) {
                    const novoSaldo = parseInt(lerSaldo()) + creditos;
                    salvarSaldo(novoSaldo);
                    fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");
                    console.log(`PAGAMENTO: R$ ${valor} | CREDITOS: +${creditos}`);
                }
            }
        } catch (error) {
            console.error("Erro ao validar pagamento");
        }
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(lerSaldo()));
app.get("/consumir", (req, res) => { salvarSaldo(0); res.send("0"); });
app.get("/", (req, res) => res.send("Grua Online. R$ 5,00/jogada. Saldo: " + lerSaldo()));

app.listen(process.env.PORT || 3000);

