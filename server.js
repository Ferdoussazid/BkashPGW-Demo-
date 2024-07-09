const express = require('express');
const app = express();
app.use(express.json()); 

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

var contacts = [
    {
        id: "1",
        name: 'John Doe'
    }
];

app.get('/contact', (req, res) => {
    res.send({
        success: true,
        message: 'Data Fetched Successfully', 
        data: contacts
    });
});

app.post('/contact', (req, res) => {
    var name = req.body.name;
    if(name){
        contacts.push({
            id: (contacts.length + 1).toString(),
            name: name
        });
        res.send({
            success: true,
            message: "Data added successfully", 
        });
    }
    else{
        res.send({
            success: false,
            message: "Validation Error",
            errors:[
                {
                    field: "name",
                    message: "Name is required"
                }
            ]
        });
        }
    }
);

app.delete('/contact/:id', (req, res) => {
    var id = req.params.id;
    var newContacts = contacts.filter(e1 => e1.id !=id)
    contacts = newContacts;

    res.send({
        success: true,
        message: 'Data Deleted Successfully',
    });
});

app.put('/contact/:id', (req, res) => {
    var id = req.params.id;
    var name = req.body.name;

    if (name) {
        var index = contacts.findIndex(e1 => e1.id == id); // Use findIndex and correct comparison

        if (index !== -1) { // Ensure the contact exists
            contacts[index] = { ...contacts[index], name: name };

            res.send({
                success: true,
                message: 'Data Updated Successfully',
            });
        } else {
            res.send({
                success: false,
                message: "Contact not found",
                errors: [
                    {
                        field: "id",
                        message: "No contact found with the given id"
                    }
                ]
            });
        }
    } else {
        res.send({
            success: false,
            message: "Validation Error",
            errors: [
                {
                    field: "name",
                    message: "Name cannot be null"
                }
            ]
        });
    }
});

//bkash_pay (Takes amonunt as body param,returns the response of grant token) - Basically 3rd party API.

