const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("BOT ONLINE 🚀");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Servidor rodando");
});
