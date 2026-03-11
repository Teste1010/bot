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
    const idempotencyKey = "key_" + Date.now();
    const body = {
        transaction_amount: 5.00,
        description: "Jogada Grua",
        payment_method_id: "pix",
        payer: { email: "cliente_grua@gmail.com", first_name: "Cliente", last_name: "Grua" }
    };

    try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "X-Idempotency-Key": idempotencyKey
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (data.point_of_interaction) {
            const copiaEcola = data.point_of_interaction.transaction_data.qr_code;
            res.send(`
                <div style="text-align:center; font-family:sans-serif; padding:20px;">
                    <h2 style="color:#2196F3;">Pagamento da Grua</h2>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(copiaEcola)}" style="border:10px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <p>Escaneie o QR Code ou use o Copia e Cola:</p>
                    <textarea style="width:100%;height:80px;">${copiaEcola}</textarea>
                    <p style="background:#e3f2fd; padding:10px; border-radius:5px;"><b>Após pagar, a máquina libera em segundos!</b></p>
                </div>
            `);
        } else { res.send("Erro MP: " + data.message); }
    } catch (error) { res.status(500).send("Erro no servidor"); }
});

app.post("/webhook", async (req, res) => {
    const { data, type } = req.body;
    if (type === "payment" && data) {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
        });
        const payment = await response.json();
        if (payment.status === "approved") {
            let valorPago = payment.transaction_amount;
            salvarCreditos(lerCreditos() + valorPago);
        }
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => { res.send(lerCreditos().toString()); });

app.get("/consumir", (req, res) => {
    salvarCreditos(0); // ZERA TUDO (Lógica de ficar com o troco)
    res.send("ok");
});

app.get("/", (req, res) => res.send("BOT GRUA ONLINE"));
app.listen(process.env.PORT || 3000, "0.0.0.0");
