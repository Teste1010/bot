const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const app = express();

app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";


// Funções para gerenciar o arquivo de créditos
const lerCreditos = () => {
    try {
        if (!fs.existsSync("creditos.txt")) return 0;
        return parseInt(fs.readFileSync("creditos.txt", "utf8")) || 0;
    } catch (e) { return 0; }
};

const salvarCreditos = (valor) => {
    fs.writeFileSync("creditos.txt", valor.toString());
};

// ROTA PARA GERAR O PIX (Para o adesivo da máquina)
app.get("/pix", async (req, res) => {
    const body = {
        transaction_amount: 5.00,
        description: "Jogada Grua Pix",
        payment_method_id: "pix",
        payer: { email: "cliente@grua.com" }
    };

    try {
        const response = await fetch("https://api.mercadopago.com/v1/payments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        
        if (data.point_of_interaction) {
            const copiaEcola = data.point_of_interaction.transaction_data.qr_code;
            res.send(`
                <div style="text-align:center; font-family:sans-serif; padding:20px;">
                    <h2>Pagamento de R$ 5,00</h2>
                    <p>Escaneie o QR Code ou use o Copia e Cola:</p>
                    <textarea style="width:100%;height:80px;">${copiaEcola}</textarea>
                    <br><br>
                    <img src="https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(copiaEcola)}&chs=250x250" alt="QR Code Pix">
                    <p>Após pagar, sua jogada será liberada automaticamente!</p>
                </div>
            `);
        } else {
            res.send("Erro ao gerar Pix. Verifique o Access Token no Railway.");
        }
    } catch (error) {
        res.status(500).send("Erro no servidor");
    }
});

// WEBHOOK - ONDE O MERCADO PAGO AVISA QUE O PIX OU CARTÃO FOI PAGO
app.post("/webhook", async (req, res) => {
    const { data, type } = req.body;
    
    // Verifica se é uma notificação de pagamento
    if (type === "payment" && data) {
        try {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
                headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` }
            });
            const payment = await response.json();
            
            if (payment.status === "approved") {
                console.log(`Pagamento ${data.id} aprovado! Valor: ${payment.transaction_amount}`);
                let total = lerCreditos();
                // Adiciona 5 créditos (ou o valor que você preferir)
                salvarCreditos(total + 5); 
            }
        } catch (e) {
            console.error("Erro ao processar webhook:", e);
        }
    }
    res.sendStatus(200); // Responde OK para o Mercado Pago não dar erro 404
});

// Rotas que o ESP32 usa
app.get("/check", (req, res) => {
    let creditos = lerCreditos();
    res.send(creditos >= 5 ? "5" : "0");
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

// Rota de teste manual (Igual a que você já usou)
app.get("/add/:valor", (req, res) => {
    const valor = parseInt(req.params.valor);
    let total = lerCreditos();
    salvarCreditos(total + valor);
    res.send("OK");
});

app.get("/", (req, res) => res.send("BOT GRUA ONLINE"));

app.listen(process.env.PORT || 3000, "0.0.0.0", () => console.log("Servidor Online"));

