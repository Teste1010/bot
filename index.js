const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");

const app = express();
app.use(express.json());

const ACCESS_TOKEN = "APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981";

let coinsPendentes = 0;
let pagamentosProcessados = {};

// carregar créditos salvos
if (fs.existsSync("coins.txt")) {
  coinsPendentes = parseInt(fs.readFileSync("coins.txt"));
}

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

app.post("/webhook", async (req, res) => {

  console.log("Webhook recebido:", req.body);

  try {

    const paymentId = req.body.data?.id || req.body.resource || req.body.id;

    if (pagamentosProcessados[paymentId]) {
      console.log("Pagamento já processado:", paymentId);
      return res.sendStatus(200);
    }

    pagamentosProcessados[paymentId] = true;

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

    if (pagamento.status === "approved") {

      const valor = pagamento.transaction_amount;
      const coins = Math.floor(valor);

      coinsPendentes += coins;

      fs.writeFileSync("coins.txt", coinsPendentes.toString());

      console.log("Valor pago:", valor);
      console.log("Créditos adicionados:", coins);

    }

  } catch (erro) {

    console.log("Erro:", erro);

  }

  res.sendStatus(200);

});

app.get("/add/:valor", (req, res) => {

  const valor = Number(req.params.valor);

  coinsPendentes = coinsPendentes + valor;

  fs.writeFileSync("coins.txt", String(coinsPendentes));

  console.log("Créditos adicionados:", valor);
  console.log("Total agora:", coinsPendentes);

  res.send("OK");

});

app.get("/check", (req, res) => {

  if (coinsPendentes > 0) {

    const coins = coinsPendentes;

    coinsPendentes = 0;

    fs.writeFileSync("coins.txt", "0");

    res.send(String(coins));

  } else {

    res.send("0");

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

  console.log("Servidor rodando");

});
