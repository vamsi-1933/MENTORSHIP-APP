const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const existing = await User.findOne({ email: 'admin@smail.iitm.ac.in' });
    if (existing) {
      console.log('✅ Admin already exists.');
      process.exit(0);
    }

    const hash = await bcrypt.hash('password123', 10);
    await User.create({
      name: 'System Admin',
      email: 'admin@smail.iitm.ac.in',
      password: hash,
      role: 'admin',
      department: 'Administration'
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@smail.iitm.ac.in');
    console.log('Password: password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

seedAdmin();