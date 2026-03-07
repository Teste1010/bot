const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());

// ACCESS TOKEN MERCADO PAGO
const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

// COINS PENDENTES
let coinsPendentes = 0;


// TESTE SERVIDOR
app.get("/", (req, res) => {

  res.send("BOT ONLINE");

});


// WEBHOOK DO MERCADO PAGO
app.post("/webhook", async (req, res) => {

  console.log("Webhook recebido:");
  console.log(req.body);

  try {

    const paymentId = req.body.data.id;

    console.log("Payment ID:", paymentId);

    const resposta = await fetch(
      https://api.mercadopago.com/v1/payments/${paymentId},
      {
        headers: {
          Authorization: Bearer ${ACCESS_TOKEN}
        }
      }
    );

    const pagamento = await resposta.json();

    console.log("Pagamento:", pagamento);

    if (pagamento.status === "approved") {

      const valor = pagamento.transaction_amount;

      console.log("Valor aprovado:", valor);

      const coins = Math.floor(valor);

      coinsPendentes += coins;

      console.log("Coins adicionadas:", coins);
      console.log("Coins totais:", coinsPendentes);

    }

  } catch (erro) {

    console.log("Erro webhook:", erro);

  }

  res.sendStatus(200);

});


// ESP32 CONSULTA SE TEM COINS
app.get("/check", (req, res) => {

  if (coinsPendentes > 0) {

    const coins = coinsPendentes;

    coinsPendentes = 0;

    console.log("Enviando coins:", coins);

    res.send(String(coins));

  } else {

    res.send("0");

  }

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("Servidor rodando na porta", PORT);

});
