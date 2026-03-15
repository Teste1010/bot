const express = require("express");
const fs = require("fs");
const https = require("https"); 
const app = express();
app.use(express.json());

// --- NOVA CONFIGURAÇÃO ---
const ACCESS_TOKEN = "APP_USR-3278059917627331-031512-5d963b8219a8062842b20893786e170c-3173422981"; 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

app.post("/webhook", (req, res) => {
    // Lógica Inteligente para capturar o ID
    let paymentId = null;
    if (req.body?.data?.id) {
        paymentId = req.body.data.id;
    } else if (req.body?.resource && req.body.resource.includes("/")) {
        paymentId = req.body.resource.split("/").pop();
    } else if (req.body?.id) {
        paymentId = req.body.id;
    }

    console.log("Processando pagamento ID:", paymentId);

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
                        // R$ 1 a 5 = 1 crédito | Acima de 5 = Divide por 5
                        let jogadas = (valor >= 1 && valor < 5) ? 1 : Math.floor(valor / 5);

                        if (jogadas > 0) {
                            let saldoAtual = parseInt(ler());
                            salvar(saldoAtual + jogadas);
                            fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");
                            console.log(`SUCESSO: ID ${paymentId} aprovado. +${jogadas} créditos.`);
                        }
                    }
                } catch (e) { console.log("Erro ao processar dados do MP."); }
            });
        });
        request.on('error', (err) => { console.error("Erro HTTPS:", err); });
        request.end();
    }
    res.sendStatus(200); 
});

app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Servidor Grua Ativo. Saldo: " + ler()));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando com novo Token!"));

