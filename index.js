const express = require("express");
const app = express();

let pagamentoPendente = false;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("BOT ONLINE");
});

// RECEBE WEBHOOK DO MERCADO PAGO
app.post("/webhook", (req, res) => {
  console.log("Webhook recebido:");
  console.log(req.body);

  pagamentoPendente = true;

  res.sendStatus(200);
});

// ESP32 CONSULTA SE TEM PAGAMENTO
app.get("/check", (req, res) => {
  if (pagamentoPendente) {
    pagamentoPendente = false;
    res.send("PAGAR");
  } else {
    res.send("AGUARDANDO");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Servidor rodando");
});
