const express = require("express");
const fs = require("fs");
const https = require("https"); 
const app = express();
app.use(express.json());

// --- CONFIGURAÇÃO ---
const ACCESS_TOKEN = "APP_USR-3278059917627331-031512-5d963b8219a8062842b20893786e170c-3173422981"; 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

// Funções de Apoio
function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

// Rota do Webhook
app.post("/webhook", (req, res) => {
    let paymentId = req.body?.data?.id || req.body?.id;
    
    if (!paymentId && req.body?.resource) {
        paymentId = req.body.resource.toString().split("/").pop();
    }

    console.log("ID Identificado:", paymentId);

    if (paymentId && !jaPago(paymentId.toString())) {
        const options = {
            hostname: 'api.mercadopago.com',
            path: `/v1/payments/${paymentId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        };

        const request = https.request(options, (response) => {
            let bodyData = '';
            response.on('data', (chunk) => { bodyData += chunk; });
            response.on('end', () => {
                try {
                    const p = JSON.parse(bodyData);
                    if (p.status === "approved") {
                        const valor = parseFloat(p.transaction_amount);
                        let jogadas = (valor >= 1 && valor < 5) ? 1 : Math.floor(valor / 5);

                        if (jogadas > 0) {
                            let saldoAtual = parseInt(ler());
                            salvar(saldoAtual + jogadas);
                            fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");
                            console.log(`PAGO: ID ${paymentId} | +${jogadas} créditos`);
                        }
                    }
                } catch (e) { console.log("Erro ao processar dados."); }
            });
        });
        request.on('error', (err) => { console.error("Erro HTTPS:", err); });
        request.end();
    }
    res.sendStatus(200); 
});

// Rotas de verificação
app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Servidor Ativo. Saldo: " + ler()));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Rodando na porta " + PORT));
