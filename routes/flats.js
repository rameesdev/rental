const express = require('express');
const router = express.Router();
const { Flat,Person } = require('../models/Flat.js');
const LastPersonId = require('../models/LastPersonId');
const {Backup}=require("../models/Backup.js")
// Create a new flat [x]
router.post('/flats', async (req, res) => {
    try {
        const { name } = req.body;
        const flat = await Flat.findOne({name})
        
        if(flat)return res.json({status:"error",message:"Flat name already exist"});
        
        const newFlat = new Flat({ name, persons: [] });
        const savedFlat = await newFlat.save();
        res.status(201).json(savedFlat);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)
    }
});

// Get all flats  [x]
router.get('/flats', async (req, res) => {
    try {
        const flats = await Flat.find();
        res.json(flats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// Route to add a person to a flat [x]
router.post('/flats/:flatName/persons', async (req, res) => {
    try {
        const { flatName } = req.params;
        const { id, name, mobile, rent } = req.body; // Assuming id is provided by the frontend

        // Find flat by name
        const flat = await Flat.findOne({ name: flatName });
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }
        

        // Create new person object
        const newPerson = {
            id,
            name,
            mobile,
            rent: parseFloat(rent),
            pending: parseFloat(rent),
            history: []
        };

        // Push new person to flat's persons array
        const LastPersonIdDoc=await LastPersonId.findOne();
        console.log(LastPersonIdDoc)
        console.log(id)
        LastPersonIdDoc.lastPersonId=id;
        LastPersonIdDoc.save();
        flat.persons.push(newPerson);

        // Save updated flat
        const updatedFlat = await flat.save();

        // Respond with updated flat object
        res.status(201).json(updatedFlat);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)
    }
});


// Update a person in a flat
router.put('/flats/:flatId/persons/:personId', async (req, res) => {
    try {
        const { flatId, personId } = req.params;
        const { name, mobile, rent } = req.body;
        const flat = await Flat.findById(flatId);
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }
        const person = flat.persons.id(personId);
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        person.name = name;
        person.mobile = mobile;
        person.rent = rent;
        const updatedFlat = await flat.save();
        res.json(updatedFlat);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a person from a flat
router.delete('/flats/:flatName/persons/:personId', async (req, res) => {
    try {
        const { flatName, personId } = req.params;
        
        const flat = await Flat.findOne({
            name: flatName,
        })
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }
       const remainingPersons=flat.persons.filter(value=>{if(value.id!=personId){return value}})
       flat.persons=remainingPersons;
       
       flat.save();
        res.json("success");
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)
    }
});



// Route to fetch and increment person ID
router.get('/personId', async (req, res) => {
    try {
        // Try to find the current lastPersonId document
        let lastPersonIdDoc = await LastPersonId.findOne();

        // If no document exists, create a new one with default ID
        if (!lastPersonIdDoc) {
            const newLastPersonIdDoc = new LastPersonId({ lastPersonId: 0 });
            lastPersonIdDoc = await newLastPersonIdDoc.save();
        }

        // Respond with the fetched or newly created lastPersonId
        res.json({ lastPersonId: lastPersonIdDoc.lastPersonId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Make a payment for a person in a flat

router.post('/flats/:flatName/persons/:personId/payment', async (req, res) => {
    try {
        const { flatName, personId } = req.params;
        const { amount, method, transactionId } = req.body;

        // Find flat by name
        const flat = await Flat.findOne({ name: flatName });
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }

        // Find person by custom ID
        const person = flat.persons.find(p => p.id === parseInt(personId));
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }

        // Update pending amount and add to history
        person.pending -= amount;
        person.history.push({
            date: new Date(),
            amount,
            method,
            transactionId
        });

        // Save updated flat
        const updatedFlat = await flat.save();

        // Respond with updated person object
        res.status(200).json(person);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message);
    }
});
router.post('/backup', async (req, res) => {
    try {
        const { jsonData, csvContent } = req.body;

        // Save CSV content and JSON data to MongoDB or handle as needed
        // Example: Saving JSON data to MongoDB
        const backup = new Backup({
            date: jsonData.date,
            data: jsonData.flats,
            csv: csvContent // Save CSV content as a string if needed
        });

        await backup.save();

        res.status(200).json({ message: 'Backup saved successfully.' });

    } catch (error) {
        console.error('Error saving backup:', error);
        res.status(500).json({ error: 'Failed to save backup.' });
    }
});
router.put('/new-month', async (req, res) => {
    try {
        // Fetch all flats with persons
        const flats = await Flat.find();

        // Update pending for each person in each flat
        const updatedFlats = await Promise.all(flats.map(async flat => {
            // Update pending for each person in the flat
            flat.persons.forEach(person => {
                // Calculate new pending amount for new month
                person.pending += person.rent;
            });

            // Save updated flat
            return await flat.save();
        }));

        res.json("success");
    } catch (error) {
        console.error('Error updating pending amounts for new month:', error.message);
        res.status(500).json({ error: 'Failed to update pending amounts for new month' });
    }
});
module.exports = router;
