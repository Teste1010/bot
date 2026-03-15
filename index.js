const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

// --- COLOQUE SEU TOKEN REAL ABAIXO ---
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981"; 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

app.post("/webhook", async (req, res) => {
    const pId = req.body.data?.id || req.body.id;
    console.log("Recebi ID:", pId); // Isso vai aparecer nos logs do Railway

    if (pId && !jaPago(pId)) {
        try {
            const r = await fetch(`https://api.mercadopago.com/v1/payments/${pId}`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            const p = await r.json();

            if (p.status === "approved") {
                const valor = parseFloat(p.transaction_amount);
                let creditos = 0;

                if (valor >= 1.00 && valor < 5.00) {
                    creditos = 1; // Teste de 1 real
                } else {
                    creditos = Math.floor(valor / 5); // Regra de 5 reais
                }

                if (creditos > 0) {
                    salvar(parseInt(ler()) + creditos);
                    fs.appendFileSync(LOG_PAGAMENTOS, pId + "\n");
                }
            }
        } catch (e) { console.error("Erro no Token ou MP"); }
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Servidor Ativo. Saldo: " + ler()));

app.listen(process.env.PORT || 3000, () => console.log("Servidor Online!"));
