const mongoose = require('mongoose');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
const path = require("path")
const fs = require("fs");
const { Month } = require('./models/Backup');
const { Flat } = require('./models/Flat');

require("dotenv").config()
const MONGODB_URI = process.env.URI;
mongoose.connect(MONGODB_URI, {});
const uploadsPath = path.join(__dirname, 'uploads');

// Check if the 'uploads' folder exists
if (!fs.existsSync(uploadsPath)) {
    // Folder does not exist, create it
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('Uploads folder created.');
} else {
    console.log('Uploads folder already exists.');
}
async function checkAndCreateMonth() {
    try {
      
  
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Pads single-digit months with a leading zero
        const year = now.getFullYear();
        const monthStr = `${month}/${year}`;
      const existingMonth = await Month.findOne({});
  
      if (!existingMonth) {
        // If not found, create a new document
        const newMonth = new Month({
          month: monthStr,
          date: now,
          data: [], // Initialize with empty array or desired default value
        });
  
        await newMonth.save();
        console.log(`Created new month document for ${monthStr}`);
      } else {
        console.log(`Month document for ${monthStr} already exists`);
        existingMonth.data = await Flat.find();
      }
    } catch (error) {
      console.error('Error checking or creating month document:', error);
    }
  }
  

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open',async () => {console.log('Connected to MongoDB');await checkAndCreateMonth()});
app.use(cookieParser())
app.use(express.json()); // Middleware to parse JSON bodies
app.get("/favicon.ico",(req,res)=>res.sendFile(__dirname+"/bsm.PNG"))
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
app.get("/status",(req,res)=>{
    console.log("works");
})
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
