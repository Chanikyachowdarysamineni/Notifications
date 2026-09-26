const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "A", "B", "C"
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true }
});

module.exports = mongoose.model('Section', sectionSchema);
