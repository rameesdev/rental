const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Flat,Person } = require('../models/Flat.js');
const LastPersonId = require('../models/LastPersonId');
const {Backup}=require("../models/Backup.js")
const jwt = require("jsonwebtoken")
const {createFolder,uploadFile,getFile} = require("../utils/googleDrive.js")
const multer = require('multer');
const upload = multer({ dest: './uploads/' })
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
        
        console.log(flats)
        res.json({flats,username:req.session.username});

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




// Route to add a person to a flat [x]
const cpUpload = upload.fields([{ name: 'passportFront', maxCount: 1 }, { name: 'passportBack', maxCount: 1 },{name:'qrid',maxCount:1}])

router.post('/flats/:flatName/persons',cpUpload, async (req, res) => {
    try {
        const id=uuidv4()
        const { flatName } = req.params;
        const { name, mobile, rent } = req.body; // Assuming id is provided by the frontend
       
        // Find flat by name
        //passport
        //qrid 
        const files = req.files;
        let folderData,passportFront,passportBack,qrid;
        
       
        
        try{
           
        folderData=await createFolder(name,"1LlADbdd8NzANTgi39p5Hnc6XIASyKjxy")
        console.log(folderData)
         if(files.passportFront)passportFront = await uploadFile("./"+files.passportFront[0].path,folderData.id,"passportFront",files.passportFront[0].mimetype)
         if(files.passportBack)passportBack = await uploadFile("./"+files.passportBack[0].path,folderData.id,"passportBack",files.passportBack[0].mimetype)
        if(files.qrid)qrid= await uploadFile("./"+files.qrid[0].path,folderData.id,"qrid",files.passportFront[0].mimetype)
        console.log({passportFront,passportBack,qrid})

        }catch(err){
            res.status(500).json({ message: err.message });
            console.log(err.message);
            return;
            
        }
    
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
            history: [],
            folderId:folderData.id,
            passportBack,
            passportFront,qrid
        };

      
        flat.persons.push(newPerson);

        // Save updated flat
        const updatedFlat = await flat.save();

        // Respond with updated flat object
        res.status(201).json(newPerson);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)
    }
});


// Update a person in a flat
router.put('/flats/:flatId/persons/:personId', async (req, res) => {
    try {
        const { flatId, personId } = req.params;
        const { name, mobile, rent ,pending} = req.body;
        const flat = await Flat.findOne({name:flatId});
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }
        let person = flat.persons.filter((value)=>{if(value.id===personId)return value;})
        person = person[0]
        console.log(person)
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        person.name = name;
        person.mobile = mobile;
        person.rent = rent;
        person.pending = pending;
        const updatedFlat = await flat.save();
        res.json(updatedFlat);
    } catch (err) {
        console.log(err.message)
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
       
       await flat.save();
        res.json("success");
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)
    }
});



// Route to fetch and increment person ID


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
        const person = flat.persons.find(p => p.id ===personId);
        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }

        // Update pending amount and add to history
        person.pending -= amount;
        person.history.push({
            date: new Date(),
            amount,
            method,
            transactionId,
            by:req.session.username
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
router.post("/login", (req, res) => {
    try {
        const { username, password } = req.body;

        // Check for missing credentials
        if (!username || !password) {
            res.status(400).json({ status: "error", message: "Invalid credentials" });
            return; // Ensure no further code is executed
        }

        const validUsernames = process.env.USERNAMES.split(",");
        
        // Check if username exists
        if (!validUsernames.includes(username)) {
            res.status(400).json({ status: "error", message: "User not found" });
            return; // Ensure no further code is executed
        }

        // Check password
        if (password !== process.env.PASSWORD) {
            res.status(400).json({ status: "error", message: "Wrong password" });
            return; // Ensure no further code is executed
        }

        // Generate JWT token
        const token = jwt.sign({ username }, process.env.SECRET, { expiresIn: "14d" });

        // Set cookie with JWT token
        res.cookie('token', token, {
            maxAge: 1209600000, // 14 days in milliseconds
            httpOnly: true,
            //secure: true, // Set to true if using HTTPS
            sameSite: 'strict'
        });

        // Send success response
        res.status(200).json({ status: "success", message: "Login successful" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: "error", message: "Server error, please try again later" });
    }
});
router.get("/documents/:id",async(req,res)=>{
    const {id}=req.params;
    const data=Buffer.from(await getFile(id))
    
    if(data){res.write(data);res.end();return}

})
module.exports = router;