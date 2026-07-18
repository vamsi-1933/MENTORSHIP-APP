const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'super_coordinator', 'coordinator', 'mentor', 'mentee'], 
    default: 'mentee' 
  },
  department: { type: String },
  hostel: { type: String }
}, { timestamps: true });

// ✅ CORRECT ASYNC PRE-SAVE HOOK (No 'next' parameter)
userSchema.pre('save', async function() {
  // Only hash if password was modified or is new
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);