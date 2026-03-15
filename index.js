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

app.post("/webhook", async (req, res) => {
    // Pega o ID do pagamento
    const pId = req.body.data?.id || req.body.id;
    
    // SÓ ENTRA SE TIVER ID E SE NÃO FOI PAGO ANTES (TRAVA DUPLICADO)
    if (pId && !jaPago(pId)) {
        try {
            const r = await fetch(`https://api.mercadopago.com/v1/payments/${pId}`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            const p = await r.json();

            // SÓ LIBERA SE O MERCADO PAGO DISSER "APPROVED"
            if (p.status === "approved") {
                const valor = parseFloat(p.transaction_amount);
                let creditos = 0;

                // Regra: R$ 5,00 por jogada (Aceita R$ 1,00 para seu teste)
                if (valor >= 1.00 && valor < 5.00) {
                    creditos = 1; 
                } else {
                    creditos = Math.floor(valor / 5);
                }

                if (creditos > 0) {
                    const novoSaldo = parseInt(ler()) + creditos;
                    salvar(novoSaldo);
                    // ANOTA O ID PARA NÃO REPETIR NUNCA MAIS ESSE PAGAMENTO
                    fs.appendFileSync(LOG_PAGAMENTOS, pId + "\n");
                    console.log(`PAGO: ID ${pId} - Valor R$ ${valor} - Créditos +${creditos}`);
                }
            }
        } catch (e) {
            console.log("Erro ao validar pagamento.");
        }
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Grua Online. Saldo: " + ler()));

app.listen(process.env.PORT || 3000);
