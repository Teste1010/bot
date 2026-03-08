const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let coinsPendentes = 0;

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

app.post("/webhook", async (req, res) => {

  console.log("Webhook recebido:", req.body);

  try {

   const paymentId = req.body.resource.split("/").pop();

    const resposta = await fetch(
      "https://api.mercadopago.com/v1/payments/" + paymentId,
      {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + ACCESS_TOKEN
        }
      }
    );

    const pagamento = await resposta.json();

    console.log(pagamento);

    if (pagamento.status === "approved") {

      const valor = pagamento.transaction_amount;

      const coins = Math.floor(valor);
      
      coinsPendentes += coins;

      console.log("Coins adicionadas:", coins);

    }

  } catch (erro) {

    console.log("Erro:", erro);

  }

  res.sendStatus(200);

});

app.get("/check", (req, res) => {

  if (coinsPendentes > 0) {

    const coins = coinsPendentes;

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
