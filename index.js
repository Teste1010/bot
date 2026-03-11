const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

const lerCreditos = () => {
    try {
        if (!fs.existsSync("creditos.txt")) return 0;
        return parseFloat(fs.readFileSync("creditos.txt", "utf8")) || 0;
    } catch (e) { return 0; }
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toString());
};

app.get("/pix", async (req, res) => {
    try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "X-Idempotency-Key": "key_" + Date.now()
            },
            body: JSON.stringify({
                transaction_amount: 5.00,
                description: "Creditos Grua",
                payment_method_id: "pix",
                payer: { email: "cliente@grua.com" }
            })
        });
        const data = await response.json();
        if (data.point_of_interaction) {
            const qr = data.point_of_interaction.transaction_data.qr_code;
            res.send(`<div style="text-align:center;font-family:sans-serif;"><h2>Pagamento Grua</h2><img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr)}"><br><textarea style="width:80%;height:50px;">${qr}</textarea><p>Apos pagar, a maquina libera!</p></div>`);
        } else { res.send("Erro no Mercado Pago. Verifique o Token."); }
    } catch (e) { res.send("Erro no Servidor."); }
});

app.post("/webhook", async (req, res) => {
    const { data, type } = req.body;
    if (type === "payment") {
        const r = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
        });
        const p = await r.json();
        if (p.status === "approved") { salvarCreditos(lerCreditos() + p.transaction_amount); }
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => res.send(lerCreditos().toString()));
app.get("/consumir", (req, res) => { salvarCreditos(0); res.send("ok"); });
app.get("/", (req, res) => res.send("Servidor OK"));
app.listen(process.env.PORT || 3000);
