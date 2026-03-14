const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

const ler = () => { try { return fs.readFileSync("creditos.txt", "utf8"); } catch (e) { return "0"; } };
const salvar = (v) => fs.writeFileSync("creditos.txt", v.toString());

// Rota para gerar QR Code de R$ 5,00 (Para quem não usar a maquininha)
app.get("/pix", async (req, res) => {
    try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ACCESS_TOKEN}`, "X-Idempotency-Key": "k" + Date.now() },
            body: JSON.stringify({ transaction_amount: 5.0, description: "Grua", payment_method_id: "pix", payer: { email: "c@g.com" } })
        });
        const data = await response.json();
        const qr = data.point_of_interaction.transaction_data.qr_code;
        res.send(`<div style="text-align:center;font-family:sans-serif;"><h2>Pagamento Grua</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}"><br><p>R$ 5,00 = 5 Créditos</p><textarea style="width:80%;height:50px;">${qr}</textarea></div>`);
    } catch (e) { res.send("Servidor em manutenção, tente em 1 minuto."); }
});

// WEBHOOK - O coração do sistema (Aceita Cartão e Pix da Maquininha)
app.post("/webhook", async (req, res) => {
    try {
        const paymentId = req.body.data ? req.body.data.id : (req.body.type === 'payment' ? req.body.id : null);
        
        if (paymentId) {
            const r = await fetch("https://api.mercadopago.com/v1/payments/" + paymentId, { 
                headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` } 
            });
            const p = await r.json();

            if (p.status === "approved") {
                const valorPago = parseFloat(p.transaction_amount);
                const saldoAtual = parseFloat(ler());
                salvar(saldoAtual + valorPago);
                console.log(`PAGAMENTO APROVADO: R$ ${valorPago} via ${p.payment_method_id}`);
            }
        }
    } catch (err) {
        console.error("Erro no processamento do pagamento:", err);
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(ler()));
app.get("/consumir", (req, res) => { salvar(0); res.send("ok"); });
app.get("/", (req, res) => res.send("SISTEMA ONLINE"));

app.listen(process.env.PORT || 8080);

