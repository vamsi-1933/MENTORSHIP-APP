const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ email: 'admin@smail.iitm.ac.in' });
  
  if (!admin) {
    console.log('❌ ADMIN USER DOES NOT EXIST - Run: node seed-admin.js');
  } else {
    console.log('✅ Admin found!');
    console.log('Role:', admin.role);
    console.log('Password starts with $2a$10$:', admin.password.startsWith('$2a$10$'));
    console.log('Password length:', admin.password.length);
    
    // Test bcrypt comparison
    const bcrypt = require('bcryptjs');
    const match = await bcrypt.compare('password123', admin.password);
    console.log('Does "password123" match?', match);
  }
  process.exit(0);
})();