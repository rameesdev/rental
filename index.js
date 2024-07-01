const mongoose = require('mongoose');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
path = require("path")
require("dotenv").config()
const MONGODB_URI = process.env.URI;


mongoose.connect(MONGODB_URI, {});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));
app.use(cookieParser())
app.use(express.json()); // Middleware to parse JSON bodies
app.use((req, res, next) => {
    
    
    if (req.path === "/api/login") {
        return next();
    }
    
    if (req.cookies?.token) {
        try {
            const decoded = jwt.verify(req.cookies.token, process.env.SECRET);
            if (process.env.USERNAMES.split(",").includes(decoded.username)) {
                req.session = {}; // Initialize session object
                req.session.username = decoded.username;
                return next();
            } else {
                return res.sendFile(path.join(__dirname, "/public/login.html"));
            }
        } catch (err) {
            console.error(err.message);
            return res.sendFile(path.join(__dirname, "/public/login.html"));
        }
    } else {
        return res.sendFile(path.join(__dirname, "/public/login.html"));
    }
});
// Use your defined routes
app.use('/api', require('./routes/flats')); // Adjust path as per your project structure
app.get("",(req,res)=>{console.log(req.session.username);res.sendFile(__dirname+"/public/index.html")})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
