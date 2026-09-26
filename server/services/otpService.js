const { sendEmail } = require('./emailService');

const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
      <h2>CSE HUB OTP Verification</h2>
      <p>Your one-time password (OTP) is:</p>
      <h1 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
      <p>Regards,<br>CSE HUB</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'CSE HUB - Your Verification OTP',
    text: `Your CSE HUB verification OTP is: ${otp}`,
    html
  });
};

const sendResetPasswordEmail = async (email, resetToken) => {
  // Assuming frontend is running locally, in production replace with your real domain
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset your CSE HUB password.</p>
      <a href="${resetLink}" style="display:inline-block; padding:10px 20px; background-color:#4A90E2; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
      <p>Regards,<br>CSE HUB</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'CSE HUB - Reset Your Password',
    text: `Reset your password using this link: ${resetLink}`,
    html
  });
}

module.exports = { generateOTP, sendOTPEmail, sendResetPasswordEmail };
