const express = require('express');
const axios = require('axios');
const bkashUrl = require('../Express Crud/credentials.json')
const app = express();
app.use(express.json()); 

//let storedAmount = null; 

app.listen(8000, () => {
    console.log('Server is running on port 8000'); 
});


const username = '01770618567';
const password = 'D7DaC<*E*eG';
const appKey = '0vWQuCRGiUX7EPVjQDr0EUAYtc';
const appSecret = 'jcUNPBgbcqEDedNKdvE4G1cAK7D3hCjmJccNPZZBq96QIxxwAMEx';



app.post('/bkash_pay', async (req, res) => {
    const amount = req.body.amount; 
    const storedAmount = amount;
    
    if (!amount) {
        return res.status(400).send({
            success: false,
            message: "Validation Error",
            errors: [
                {
                    field: "amount",
                    message: "Amount is required"
                }
            ]
        });
    }

    //storedAmount = amount;

    try {
        
        console.log(JSON.stringify(
            {
                 'app_key': appKey,
                 'app_secret': appSecret,
             }))

        const response = await axios.post(bkashUrl.grant_token_url, {
            'app_key': appKey,
            'app_secret': appSecret,
        }, {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                username: username,
                password: password,
              }

        
        })

        .then(resp=>{
            //console.log(resp.data);
            res.json(resp.data.id_token);
        })

        
        
    } catch (error) {
        
        res.status(500).send({
            success: false,
            message: "Failed to get grant token",
            error: error.response ? error.response.data : error.message
        });
    }
});
