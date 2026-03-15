const express = require("express");
const fs = require("fs");
const https = require("https");
const app = express();
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-3278059917627331-031512-5d963b8219a8062842b20893786e170c-3173422981";
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

app.post("/webhook", (req, res) => {
    let pId = req.body?.data?.id || req.body?.id || (req.body?.resource ? req.body.resource.split("/").pop() : null);
    console.log("ID:", pId);
    if (pId && !jaPago(pId.toString())) {
        https.get(`https://api.mercadopago.com/v1/payments/${pId}`, {
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        }, (resMP) => {
            let d = '';
            resMP.on('data', (chunk) => { d += chunk; });
            resMP.on('end', () => {
                try {
                    const p = JSON.parse(d);
                    if (p.status === "approved") {
                        let v = parseFloat(p.transaction_amount);
                        let j = (v >= 1 && v < 5) ? 1 : Math.floor(v / 5);
                        if (j > 0) {
                            salvar(parseInt(ler()) + j);
                            fs.appendFileSync(LOG_PAGAMENTOS, pId + "\n");
                            console.log("PAGO: +" + j);
                        }
                    }
                } catch (e) {}
            });
        });
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Ativo. Saldo: " + ler()));

app.listen(process.env.PORT || 3000);
