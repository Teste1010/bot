const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.json());

// --- CONFIGURAÇÃO ---
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981"; // 
const BANCO_DADOS = "saldo.txt";
const LOG_PAGAMENTOS = "processados.txt";

function ler() { try { return fs.readFileSync(BANCO_DADOS, "utf8"); } catch { return "0"; } }
function salvar(v) { fs.writeFileSync(BANCO_DADOS, v.toString()); }
function jaPago(id) { try { return fs.readFileSync(LOG_PAGAMENTOS, "utf8").includes(id); } catch { return false; } }

app.post("/webhook", async (req, res) => {
    // 1. Pega o ID conforme seu amigo sugeriu
    const paymentId = req.body.data?.id || req.body.id;
    console.log("Recebi aviso do pagamento ID:", paymentId);

    // 2. Trava para não dar crédito em dobro
    if (paymentId && !jaPago(paymentId)) {
        try {
            // 3. Consulta o Mercado Pago (Fetch nativo do Node moderno)
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
            });
            const data = await response.json();

            // 4. Só libera se o status for aprovado
            if (data.status === "approved") {
                const valor = parseFloat(data.transaction_amount);
                let jogadas = 0;

                // --- REGRA DE VALOR ---
                if (valor >= 1.00 && valor < 5.00) {
                    jogadas = 1; // Teste de 1 real
                } else {
                    jogadas = Math.floor(valor / 5); // R$ 5 = 1, R$ 10 = 2, etc.
                }

                if (jogadas > 0) {
                    const novoSaldo = parseInt(ler()) + jogadas;
                    salvar(novoSaldo);
                    // Anota o ID para nunca repetir esse pagamento
                    fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");
                    console.log(`PAGAMENTO APROVADO: R$ ${valor} -> +${jogadas} jogadas`);
                }
            }
        } catch (error) {
            console.error("Erro ao validar com Mercado Pago. Verifique o Token.");
        }
    }
    // Sempre responde 200 para o Mercado Pago não ficar reenviando
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("0"); });
app.get("/", (req, res) => res.send("Grua Online. Preço: R$ 5,00/jogada. Saldo: " + ler()));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor ativo na porta " + PORT));

