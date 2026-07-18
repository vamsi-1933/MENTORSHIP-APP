const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  mentor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  mentee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  department: { 
    type: String, 
    required: true 
  },
  hostel: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'rejected'], 
    default: 'active' 
  },
  goals: [String],
  allottedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  allottedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

module.exports = mongoose.model('Mentorship', mentorshipSchema);