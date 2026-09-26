const ROLES = {
  ADMIN: 'admin',
  DEO: 'deo',
  FACULTY: 'faculty',
  STUDENT: 'student'
};

const CONFIG = {
  OTP_EXPIRY_MINS: Number(process.env.OTP_EXPIRY_MINS) || 10,
  RESET_TOKEN_EXPIRY_MINS: Number(process.env.RESET_TOKEN_EXPIRY_MINS) || 15,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  PAGINATION_LIMIT: Number(process.env.PAGINATION_LIMIT) || 10,
  FILE_SIZE_LIMIT_MB: Number(process.env.FILE_SIZE_LIMIT_MB) || 5,
};

module.exports = {
  ROLES,
  CONFIG
};
