const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Flat, Person } = require('../models/Flat.js');
const LastPersonId = require('../models/LastPersonId');
const { Backup, Month } = require("../models/Backup.js")
const jwt = require("jsonwebtoken")
const { createFolder, uploadFile, getFile } = require("../utils/googleDrive.js")
const multer = require('multer');
const upload = multer({ dest: './uploads/' });
require("dotenv").config();
// Create a new flat [x]
router.post('/flats', async (req, res) => {
    try {
        const { name } = req.body;
        const flat = await Flat.findOne({ name })

        if (flat) return res.json({ status: "error", message: "Flat name already exist" });

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
        let flats;
        const { month } = req.query;
        if (month) {
            const currentMonth = await Month.findOne().sort({ date: -1 });
            if (currentMonth.month == month) { flats = await Flat.find() }
            else {
                const oldMonth = await Month.findOne({ month });
                if(oldMonth)flats = oldMonth.data;
                else flats = []
            }
        
           console.log(flats,month)

          return res.json({ flats, username: req.session.username });
        }
        flats =  await Flat.find();
        let months = await Month.find().sort({date:-1});
        months = months.map(value=>value.month);
        return res.json({ flats, username: req.session.username ,months});
        

    } catch (err) {
        res.status(500).json({ message: err.message });
        console.log(err.message)

    }})

// Route to add a person to a flat [x]
const cpUpload = upload.fields([{ name: 'passportFront', maxCount: 1 }, { name: 'passportBack', maxCount: 1 }, { name: 'qrid', maxCount: 1 }])
router.get("/logout",(req,res)=>{
    res.clearCookie('token');
    res.json("success")
})
router.post('/flats/:flatName/persons', cpUpload, async (req, res) => {
    try {
        const id = uuidv4()
        const { flatName } = req.params;
        const { name, mobile, rent } = req.body; // Assuming id is provided by the frontend

        // Find flat by name
        //passport
        //qrid 
        const files = req.files;
        let folderData, passportFront, passportBack, qrid;



        try {

            folderData = await createFolder(name, "1LlADbdd8NzANTgi39p5Hnc6XIASyKjxy")

            if (files.passportFront) passportFront = await uploadFile("./" + files.passportFront[0].path, folderData.id, "passportFront", files.passportFront[0].mimetype)
            if (files.passportBack) passportBack = await uploadFile("./" + files.passportBack[0].path, folderData.id, "passportBack", files.passportBack[0].mimetype)
            if (files.qrid) qrid = await uploadFile("./" + files.qrid[0].path, folderData.id, "qrid", files.qrid[0].mimetype)
               

        } catch (err) {
            res.status(500).json({ message: err.message });
            console.log(err);
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
            folderId: folderData.id,
            passportBack,
            passportFront, qrid
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
router.put('/flats/:flatId/persons/:personId', cpUpload,async (req, res) => {
    try {
        const { flatId, personId } = req.params;
        const { name, mobile, rent, pending } = req.body;
        const flat = await Flat.findOne({ name: flatId });
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }
        let person = flat.persons.filter((value) => { if (value.id === personId) return value; })
        person = person[0]

        if (!person) {
            return res.status(404).json({ message: 'Person not found' });
        }
        
        
                // Find flat by name
                //passport
                //qrid 
                const files = req.files;
                let folderData, passportFront, passportBack, qrid;
                    if(!person.folderId)folderData = await createFolder(name, "1LlADbdd8NzANTgi39p5Hnc6XIASyKjxy")
                    else folderData = {id:person.folderId};
                    if (files.passportFront) passportFront = await uploadFile("./" + files.passportFront[0].path, folderData.id, "passportFront", files.passportFront[0].mimetype)
                    if (files.passportBack) passportBack = await uploadFile("./" + files.passportBack[0].path, folderData.id, "passportBack", files.passportBack[0].mimetype)
                    if (files.qrid) qrid = await uploadFile("./" + files.qrid[0].path, folderData.id, "qrid", files.qrid[0].mimetype)
             
        person.name = name;
        person.mobile = mobile;
        person.rent = rent;
        person.pending = pending;
        if(passportFront)person.passportFront=passportFront;
        if(passportBack)person.passportBack=passportBack;
        if(qrid)person.qrid =qrid;
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
        const {password}=req.body;
        if(!password)return res.status(404).json({message:"password required"})
        if(password!=process.env.PASSWORD)return res.status(400).json({message:"wrong password"})
        const flat = await Flat.findOne({
            name: flatName,
        })
        if (!flat) {
            return res.status(404).json({ message: 'Flat not found' });
        }
        const remainingPersons = flat.persons.filter(value => { if (value.id != personId) { return value } })
        flat.persons = remainingPersons;

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
        const person = flat.persons.find(p => p.id === personId);
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
            by: req.session.username
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
            data: jsonData,
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
            httpOnly: true
        });

        // Send success response
        res.status(200).json({ status: "success", message: "Login successful" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ status: "error", message: "Server error, please try again later" });
    }
});
router.get("/documents/:id", async (req, res) => {
    const { id } = req.params;
    const data = Buffer.from(await getFile(id))

    if (data) { res.write(data); res.end(); return }

});
router.post("/next-month",async(req,res)=>{
    const {newMonth,password}=req.body;
    if(password != process.env.PASSWORD){return res.status(400).json("wrong password")};
    try{
    const month = await Month.findOne({month:newMonth});
    if(month){return res.status(404).json("month already exist")};
    const flats = await Flat.find();

        
    const CreatedMonth = new Month({
        month: newMonth,
        date: Date.now(),
        data: [], // Initialize with empty array or desired default value
      });
      await CreatedMonth.save();
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
        
      res.json("success")}catch(err){
console.log(err.message);
res.status(500).json("server error")
      }

})
const changeStream = Flat.watch();

changeStream.on("change", async (change) => {
    const month = await Month.findOne({}).sort({ date: -1 });
    month.data = await Flat.find();
    await month.save();
    console.log("month saved" + month.month)
});

module.exports = router;