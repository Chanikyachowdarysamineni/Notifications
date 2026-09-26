const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  reg_no: { type: String, unique: true, sparse: true },
  employee_id: { type: String, unique: true, sparse: true },
  designation: { type: String },
  dob: { type: Date, required: true },
  mobile: { type: String, required: true },
  password_hash: { type: String }, // Optional initially
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true,
  },
  is_first_login: { type: Boolean, default: true },
  otp_code: { type: String, default: null },
  otp_expires_at: { type: Date, default: null },
  reset_token_hash: { type: String, default: null },
  reset_token_expires_at: { type: Date, default: null },
  // Student specific
  cgpa: { type: Number },
  year: { type: mongoose.Schema.Types.ObjectId, ref: 'Year' },
  section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
  // Profile Additions
  profile_image_url: { type: String, default: null },
  pending_email: { type: String, default: null },
  pending_email_otp: { type: String, default: null },
  pending_email_otp_expires_at: { type: Date, default: null },
  // Push Notifications
  device_tokens: [{ type: String }]
}, { timestamps: true });

// Validation before save
userSchema.pre('save', function () {
  if (this.role === ROLES.STUDENT) {
    if (!this.reg_no) throw new Error('Registration number is required for students.');
    if (!this.year) throw new Error('Year is required for students.');
    if (!this.section) throw new Error('Section is required for students.');
  } else {
    if (!this.email) throw new Error('Email is required for staff members.');
    if (!this.employee_id) throw new Error('Employee ID is required for staff members.');
    if (!this.designation) throw new Error('Designation is required for staff members.');
  }
});

module.exports = mongoose.model('User', userSchema);
