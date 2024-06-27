const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const personSchema = new Schema({
    id:Number,
    name: String,
    mobile: String,
    rent: Number,
    pending: Number,
    history: [
        {
            date: { type: Date, default: Date.now },
            amount: Number,
            method: String,
            transactionId: String
        }
    ]
});

const flatSchema = new Schema({
    name: {type:String,unique: true },
    persons: [personSchema]
});

const Person = mongoose.model('Person', personSchema);
const Flat = mongoose.model('Flat', flatSchema);

module.exports = { Person, Flat };
