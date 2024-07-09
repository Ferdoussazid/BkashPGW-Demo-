const express = require('express');
const axios = require('axios'); 
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json()); 

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

const bkashApiUrl = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant';
const createUrl = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create';
const executeUrl = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute';
const queryUrl = 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/payment/status';
const username = '01770618567';
const password = 'D7DaC<*E*eG';
const appKey = '0vWQuCRGiUX7EPVjQDr0EUAYtc';
const appSecret = 'jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx';

let storedToken = null;
let tokenExpiryTime = null;

const generateToken = async () => {
    try {
        const response = await axios.post(bkashApiUrl, {
            'app_key': appKey,
            'app_secret': appSecret,
        }, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                username: username,
                password: password,
            }
        });

        storedToken = response.data.id_token;
        tokenExpiryTime = Date.now() + 3600 * 1000;
        return storedToken;
    } catch (error) {
        console.error('Failed to get grant token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get grant token');
    }
};

const createPayment = async (amount) => {
    try {
        if (!storedToken || Date.now() > tokenExpiryTime) {
            console.log('Generating new token');
            await generateToken();
        }

        const response = await axios.post(createUrl, {
            mode: "0011",
            payerReference: " ",
            callbackURL: 'http://localhost:8000/callback', // Replace with your actual callback URL
            amount: amount,
            currency: "BDT",
            intent: "sale",
            merchantInvoiceNumber: "Inv" + uuidv4().substring(0, 5)
        }, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: storedToken,
                "x-app-key": appKey,
            }
        });

        return response.data;
    } catch (error) {
        console.error('Failed to create payment:', error.response ? error.response.data : error.message);
        return { success: false, message: 'Failed to create payment', error: error.response ? error.response.data : error.message };
    }
};

const executePayment = async (paymentID) => {
    try {
        const response = await axios.post(executeUrl, {
            paymentID: paymentID,
        }, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: storedToken,
                "x-app-key": appKey,
            }
        });

        return response.data;
    } catch (error) {
        console.error('Failed to execute payment:', error.response ? error.response.data : error.message);
        return { success: false, message: 'Failed to execute payment', error: error.response ? error.response.data : error.message };
    }
};


app.post('/create_pay', async (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        return res.status(400).send({
            success: false,
            message: 'Validation Error',
            errors: [
                {
                    field: 'amount',
                    message: 'Amount is required'
                }
            ]
        });
    }

    try {
        const result = await createPayment(amount);
        res.send(result);
    } catch (error) {
        res.status(500).send({
            success: false,
            message: 'Failed to process payment',
            error: error.message
        });
    }
});

app.get('/callback', async (req, res) => {
    console.log('Received callback:', req.query.status);
    const status = req.query.status;
    const paymentId = req.query.paymentID;

    if (status === 'success') {
        let response = await executePayment(paymentId);
        console.log(response);
    } 
});
