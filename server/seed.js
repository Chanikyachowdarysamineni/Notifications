require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/csehub');
    console.log('MongoDB connected.');

    const email = 'admin@csehub.com';
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log('Admin user already exists. Demo credentials:');
      console.log('Email: admin@csehub.com');
      console.log('Password: password123');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('password123', salt);

    const admin = new User({
      name: 'System Admin',
      email: email,
      employee_id: 'EMP-001',
      designation: 'HOD',
      dob: new Date('1980-01-01'),
      mobile: '9999999999',
      role: 'admin',
      password_hash: password_hash,
      is_first_login: false // Skip OTP for demo purposes
    });

    await admin.save();
    console.log('Admin user seeded successfully. Demo credentials:');
    console.log('Email: admin@csehub.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedAdmin();
