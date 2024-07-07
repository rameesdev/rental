const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const backupSchema = new Schema({
    date: { type: Date, default: Date.now },
    data: Schema.Types.Mixed, // This will store the JSON backup of all flats
    csv: String // This will store the CSV backup as a string
});

const Backup = mongoose.model('Backup', backupSchema);
const monthSchema = new mongoose.Schema({
    month: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Validate that month is in the format mm/yyyy
          return /^(0[1-9]|1[0-2])\/\d{4}$/.test(v);
        },
        message: props => `${props.value} is not a valid month format. Use mm/yyyy.`
      }
    },
    data: {
      type: [mongoose.Schema.Types.Mixed], // Allows array of mixed types
      default: []
    },
    date:{type:Date,default:Date.now}
  });
  
  const Month = mongoose.model('Month', monthSchema);
  
 
module.exports = { Backup,Month };
