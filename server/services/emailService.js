const nodemailer = require('nodemailer');

// Initialize transporter (e.g., SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (toOrObj, subject, templateName, data) => {
  let to, finalSubject, htmlContent;

  if (typeof toOrObj === 'object') {
    to = toOrObj.to;
    finalSubject = toOrObj.subject;
    htmlContent = toOrObj.html;
  } else {
    to = toOrObj;
    finalSubject = subject;
    
    // In a real implementation, you'd render an HTML template based on templateName
    // e.g. using Handlebars, EJS, or Pug. Here we use basic string templating.
    switch (templateName) {
      case 'birthday':
        htmlContent = `<h1>Happy Birthday, ${data.name}!</h1><p>Wishing you a fantastic day from CSE HUB!</p>`;
        break;
      case 'timetable_alert':
        htmlContent = `<h1>Your Schedule for Today</h1><p>${data.message}</p>`;
        break;
      case 'event_reminder':
        htmlContent = `<h1>Event Reminder: ${data.title}</h1><p>Starts at ${data.time}</p>`;
        break;
      default:
        htmlContent = `<p>${data?.message || 'Notification from CSE HUB'}</p>`;
    }
  }

  const mailOptions = {
    from: `"${process.env.MAIL_FROM_NAME || 'Notifications'}" <${process.env.MAIL_FROM_EMAIL || 'vfstrcsevignan@gmail.com'}>`,
    to,
    subject: finalSubject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
