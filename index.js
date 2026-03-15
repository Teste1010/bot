app.post("/webhook", (req, res) => {
    // Pega o ID de qualquer lugar que o Mercado Pago enviar
    let paymentId = req.body?.data?.id || req.body?.id;
    
    // Se vier no formato de link (resource), extrai apenas o número
    if (!paymentId && req.body?.resource) {
        paymentId = req.body.resource.toString().split("/").pop();
    }

    console.log("ID identificado para processar:", paymentId);

    if (paymentId && !jaPago(paymentId.toString())) {
        const options = {
            hostname: 'api.mercadopago.com',
            path: `/v1/payments/${paymentId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
        };

        const request = https.request(options, (response) => {
            let bodyData = '';
            response.on('data', (chunk) => { bodyData += chunk; });
            response.on('end', () => {
                try {
                    const p = JSON.parse(bodyData);
                    if (p.status === "approved") {
                        const valor = parseFloat(p.transaction_amount);
                        let jogadas = (valor >= 1 && valor < 5) ? 1 : Math.floor(valor / 5);

                        if (jogadas > 0) {
                            let saldoAtual = parseInt(ler());
                            salvar(saldoAtual + jogadas);
                            fs.appendFileSync(LOG_PAGAMENTOS, paymentId + "\n");
                            console.log(`SUCESSO: ID ${paymentId} aprovado. +${jogadas} créditos.`);
                        }
                    }
                } catch (e) { console.log("Erro ao processar dados do MP."); }
            });
        });
        request.on('error', (err) => { console.error("Erro HTTPS:", err); });
        request.end();
    }
    res.sendStatus(200); 
});
