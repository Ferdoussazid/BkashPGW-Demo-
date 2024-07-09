app.get('/callback', async (req, res) => {
    console.log('Received callback:', req.query.status);
    const status = req.query.status;
    const paymentId = req.query.paymentID;

    if (status === 'success') {
        let response = await executePayment(paymentId);
        console.log(response);

        if (response.message) {
            response = await queryPayment(paymentId);
        }

        if (response.statusCode && response.statusCode === '0000') {
            console.log("Payment Successful !!!");
            return res.send(JSON.stringify(response));
        } else {
            console.log('Your payment failed, here are the details - ' + '\nStatus code: ' +response.statusCode + ' Status message: '+response.statusMessage );
            return res.send('Payment failed due to ' + response.statusMessage + '. Sorry, Your payment could not be completed ');
        }
    } 
});
