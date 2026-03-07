const express = require("express");
const fetch = require("node-fetch");

const app = express();

let coinsPendentes = 0;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

app.post("/webhook", async (req, res) => {
  console.log("Webhook recebido:");
  console.log(req.body);

  try {

    const paymentId = req.body.data.id;

    const resposta = await fetch(
      https://api.mercadopago.com/v1/payments/${paymentId},
      {
        headers: {
          Authorization: Bearer SEU_ACCESS_TOKEN_AQUI
        }
      }
    );

    const pagamento = await resposta.json();

    const valor = pagamento.transaction_amount;

    console.log("Valor pago:", valor);

    coinsPendentes += Math.floor(valor);

  } catch (erro) {
    console.log("Erro webhook:", erro);
  }

  res.sendStatus(200);
});

app.get("/check", (req, res) => {

  if (coinsPendentes > 0) {

    let coins = coinsPendentes;

    coinsPendentes = 0;

    res.send(String(coins));

  } else {

    res.send("0");

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando");
});
