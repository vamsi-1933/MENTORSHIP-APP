const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const reset = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash('password123', 10);
  
  const result = await User.updateMany(
    {}, 
    { $set: { password: hash } }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} user passwords to 'password123'`);
  process.exit(0);
};

reset().catch(err => { console.error(err); process.exit(1); });