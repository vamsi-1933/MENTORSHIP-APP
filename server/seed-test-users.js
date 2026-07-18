const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash('password123', 10);
  
  const testUsers = [
    { name: 'Super Coordinator', email: 'supercoord@smail.iitm.ac.in', password: hash, role: 'super_coordinator', department: 'Core Team' },
    { name: 'CS Coordinator', email: 'coord.cs@smail.iitm.ac.in', password: hash, role: 'coordinator', department: 'Computer Science' },
    { name: 'Bio Coordinator', email: 'coord.bio@smail.iitm.ac.in', password: hash, role: 'coordinator', department: 'Biotechnology' },
    { name: 'CS Mentor', email: 'mentor.cs@smail.iitm.ac.in', password: hash, role: 'mentor', department: 'Computer Science', hostel: 'Hostel A' },
    { name: 'CS Mentee', email: 'mentee.cs@smail.iitm.ac.in', password: hash, role: 'mentee', department: 'Computer Science', hostel: 'Girls Hostel 1' }
  ];

  // Only insert if they don't already exist
  for (const u of testUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) await User.create(u);
  }

  console.log('✅ All test users created!');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });