const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("BOT ONLINE 🚀");
});

app.use(express.json());

app.post("/webhook", (req, res) => {
    console.log("Webhook recebido:");
    console.log(req.body);

    res.sendStatus(200);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Servidor rodando");
});
