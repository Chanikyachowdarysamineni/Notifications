const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "1", "2", "3", "4"
});

module.exports = mongoose.model('Year', yearSchema);
