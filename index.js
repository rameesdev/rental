const mongoose = require('mongoose');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
require("dotenv").config()
const MONGODB_URI = process.env.URI;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

app.use(express.json()); // Middleware to parse JSON bodies

// Use your defined routes
app.use('/api', require('./routes/flats')); // Adjust path as per your project structure
app.get("",(req,res)=>res.sendFile(__dirname+"/public/index.html"))

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
