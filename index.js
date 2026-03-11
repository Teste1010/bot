const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();

app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

const lerCreditos = () => {
    try {
        if (!fs.existsSync("creditos.txt")) return 0;
        return parseInt(fs.readFileSync("creditos.txt", "utf8")) || 0;
    } catch (e) { return 0; }
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toString());
};

app.get("/pix", async (req, res) => {
    // Cria uma chave única para cada tentativa de pagamento
    const idempotencyKey = "key_" + Date.now();

    const body = {
        transaction_amount: 5.00,
        description: "Jogada Grua",
        payment_method_id: "pix",
        payer: {
            email: "cliente_grua@gmail.com",
            first_name: "Cliente",
            last_name: "Grua"
        }
    };

    try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`,
                "X-Idempotency-Key": idempotencyKey // ISSO RESOLVE O ERRO
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        
        if (data.point_of_interaction) {
            const copiaEcola = data.point_of_interaction.transaction_data.qr_code;
            res.send(`
                <div style="text-align:center; font-family:sans-serif; padding:20px;">
                    <h2 style="color:#2196F3;">Pagamento da Grua</h2>
                    <p>Valor: <b>R$ 5,00</b></p>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(copiaEcola)}" style="border:10px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <p>Escaneie o QR Code acima ou use o Copia e Cola:</p>
                    <textarea style="width:100%;height:80px; font-size:12px;">${copiaEcola}</textarea>
                    <p style="background:#e3f2fd; padding:10px; border-radius:5px;"><b>Após pagar, a máquina libera em segundos!</b></p>
                </div>
            `);
        } else {
            res.send("Erro do Mercado Pago: " + (data.message || "Verifique o Token"));
            console.log("DETALHE DO ERRO:", data);
        }
    } catch (error) {
        res.status(500).send("Erro no servidor");
    }
});

app.post("/webhook", async (req, res) => {
    const { data, type } = req.body;
    if (type === "payment" && data) {
        try {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
            });
            const payment = await response.json();
            if (payment.status === "approved") {
                let total = lerCreditos();
                salvarCreditos(total + 5);
                console.log("PIX APROVADO! Saldo atualizado.");
            }
        } catch(e) { console.error(e); }
    }
    res.sendStatus(200);
});

app.get("/check", (req, res) => {
    res.send(lerCreditos() >= 5 ? "5" : "0");
});

app.get("/consumir", (req, res) => {
    let creditos = lerCreditos();
    if (creditos >= 5) {
        salvarCreditos(creditos - 5);
        res.send("ok");
    } else {
        res.send("erro");
    }
});

app.get("/add/:valor", (req, res) => {
    const valor = parseInt(req.params.valor);
    salvarCreditos(lerCreditos() + valor);
    res.send("OK");
});

app.get("/", (req, res) => res.send("BOT GRUA ONLINE"));

app.listen(process.env.PORT || 3000, "0.0.0.0", () => console.log("Online"));
