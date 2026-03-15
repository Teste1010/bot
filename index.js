const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

// --- CONFIGURAÇÃO ---
// Substitua o texto abaixo pelo seu Token que começa com APP_USR-...
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981"; 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

// Funções de leitura e escrita
function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

// ROTA DO WEBHOOK
app.post("/webhook", async (req, res) => {
    const pId = req.body.data?.id || req.body.id;
    console.log("Recebi notificação do ID:", pId);

    if (pId && !jaPago(pId)) {
        try {
            const r = await fetch(`https://api.mercadopago.com/v1/payments/${pId}`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            const p = await r.json();

            if (p.status === "approved") {
                const valor = parseFloat(p.transaction_amount);
                let creditos = 0;

                // Lógica: R$ 5,00 = 1 crédito | Aceita R$ 1,00 para seu teste agora
                if (valor >= 1.00 && valor < 5.00) {
                    creditos = 1; 
                } else {
                    creditos = Math.floor(valor / 5);
                }

                if (creditos > 0) {
                    const novoSaldo = parseInt(ler()) + creditos;
                    salvar(novoSaldo);
                    fs.appendFileSync(LOG_PAGAMENTOS, pId + "\n");
                    console.log(`PAGAMENTO APROVADO: R$ ${valor} -> +${creditos} créditos`);
                }
            }
        } catch (e) {
            console.error("Erro ao consultar Mercado Pago. Verifique o Token.");
        }
    }
    res.sendStatus(200);
});

// ROTAS DO ESP32
app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });

// ROTA DE TESTE NO NAVEGADOR
app.get("/", (req, res) => {
    res.send(`<h1>Servidor Grua Online</h1><p>Saldo Atual: <b>${ler()}</b></p>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
