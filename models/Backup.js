const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const backupSchema = new Schema({
    date: { type: Date, default: Date.now },
    data: Schema.Types.Mixed, // This will store the JSON backup of all flats
    csv: String // This will store the CSV backup as a string
});

const Backup = mongoose.model('Backup', backupSchema);

module.exports = { Backup };
