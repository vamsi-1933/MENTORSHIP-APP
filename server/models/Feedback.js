const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
  department: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
  // NOTE: No userId field - this ensures true anonymity
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);