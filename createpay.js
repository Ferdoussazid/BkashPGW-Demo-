const express = require('express');
const axios = require('axios'); 
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json()); 
app.use(cors());

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
            callbackURL: 'http://localhost:8000/callback', 
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

const queryPayment = async (paymentID) => {
    try {
        const response = await axios.post(queryUrl, {
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
        console.error('Failed to get payment details:', error.response ? error.response.data : error.message);
        return { success: false, message: 'Failed to get payment details', error: error.response ? error.response.data : error.message };
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
    const status = req.query.status;
    const paymentId = req.query.paymentID;

    const baseHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Status</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: #fff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                    text-align: center;
                }
                h1 {
                    color: #333;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                }
                li {
                    margin-bottom: 10px;
                }
                .success {
                    color: green;
                }
                .fail {
                    color: red;
                }
            </style>
        </head>
        <body>
            <div class="container">
    `;

    if (status === 'success') {
        let response = await executePayment(paymentId);

        if (response.message) {
            response = await queryPayment(paymentId);
        }

        if (response.statusCode && response.statusCode === '0000') {
            const html = `
                ${baseHtml}
                <h1 class="success">Thank you for your payment. We have received it.</h1>
                <ul>
                    <li>Payment ID: ${response.paymentID}</li>
                    <li>Transaction ID: ${response.trxID}</li>
                    <li>Transaction Status: ${response.transactionStatus}</li>
                    <li>Amount: ${response.amount}</li>
                    <li>Currency: ${response.currency}</li>
                    <li>Intent: ${response.intent}</li>
                    <li>Payment Execute Time: ${response.paymentExecuteTime}</li>
                    <li>Merchant Invoice Number: ${response.merchantInvoiceNumber}</li>
                    <li>Payer Reference: ${response.payerReference}</li>
                    <li>Customer Msisdn: ${response.customerMsisdn}</li>
                    <li>Status Code: ${response.statusCode}</li>
                    <li>Status Message: ${response.statusMessage}</li>
                </ul>
                </div>
                </body>
                </html>
            `;
            return res.send(html);
        } else {
            const html = `
                ${baseHtml}
                <h1 class="fail">Your payment failed.</h1>
                <p>Status code: ${response.statusCode}</p>
                <p>Status message: ${response.statusMessage}</p>
                </div>
                </body>
                </html>
            `;
            return res.send(html);
        }
    } else if (status === 'cancel') {
        const html = `
            ${baseHtml}
            <h1 class="fail">Your payment has been cancelled.</h1>
            </div>
            </body>
            </html>
        `;
        return res.send(html);
    } else {
        const html = `
            ${baseHtml}
            <h1 class="fail">Your payment failed.</h1>
            </div>
            </body>
            </html>
        `;
        return res.send(html);
    }
});
