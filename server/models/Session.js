const mongoose = require('mongoose')
// Inside server/models/Session.js
const sessionSchema = new mongoose.Schema({
  // ✅ CHANGE THIS LINE TO REFERENCE THE NEW MENTORSHIP MODEL
  mentorship: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Mentorship', 
    required: true 
  },
  title: String,
  scheduledDate: Date,
  duration: Number,
  interactionType: String,
  discussionTopics: [String],
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'mentee_verified', 'approved', 'rejected'], 
    default: 'draft' 
  },
  mentorReport: {
    topicsCovered: String,
    progressNotes: String,
    nextSteps: String
  },
  menteeValidation: {
    status: { type: String, enum: ['approved', 'rejected'] },
    comments: String,
    validatedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);