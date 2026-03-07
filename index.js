const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// seu Access Token do Mercado Pago
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let coinsPendentes = 0;

// rota teste
app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

// webhook Mercado Pago
app.post("/webhook", async (req, res) => {
  console.log("Webhook recebido:", req.body);

  try {
    const paymentId = req.body?.data?.id;
    if (!paymentId) {
      console.log("paymentId ausente");
      return res.sendStatus(200);
    }

    const url = https://api.mercadopago.com/v1/payments/${paymentId};

    const resposta = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: Bearer ${ACCESS_TOKEN}
      }
    });

    const pagamento = await resposta.json();
    console.log("Pagamento:", pagamento);

    if (pagamento.status === "approved") {
      const valor = Number(pagamento.transaction_amount) || 0;
      const coins = Math.floor(valor);
      coinsPendentes += coins;
      console.log("Coins adicionadas:", coins, "Total pendente:", coinsPendentes);
    }
  } catch (err) {
    console.log("Erro webhook:", err);
  }

  res.sendStatus(200);
});

// ESP32 consulta coins
app.get("/check", (req, res) => {
  if (coinsPendentes > 0) {
    const coins = coinsPendentes;
    coinsPendentes = 0;
    return res.send(String(coins));
  }
  res.send("0");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
