app.post("/webhook", async (req, res) => {

    console.log("Webhook recebido:", JSON.stringify(req.body));

    const paymentId =
    req.body?.data?.id ||
    req.body?.resource?.id ||
    req.body?.id ||
    req.body?.data;

    console.log("ID do pagamento:", paymentId);

    if (!paymentId) {
        res.sendStatus(200);
        return;
    }

    if (!jaPago(paymentId)) {

        try {

            const response = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer APP_USR-1314109241069842-021013-04bb1f033d5fa8315116794aab4a5383-3173422981`
                    }
                }
            );

            const data = await response.json();

            if (data.status === "approved") {

                const valor = parseFloat(data.transaction_amount);

                let jogadas = 0;

                if (valor >= 1 && valor < 5) {
                    jogadas = 1;
                } else {
                    jogadas = Math.floor(valor / 5);
                }

                if (jogadas > 0) {

                    let saldo = parseInt(ler());

                    saldo += jogadas;

                    salvar(saldo);

                    fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");

                    console.log("Créditos liberados:", jogadas);

                }

            }

        } catch (e) {

            console.log("Erro ao consultar pagamento");

        }

    }

    res.sendStatus(200);

});
