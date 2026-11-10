const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      connectionTimeout: 15000,
    });
    await transporter.verify();
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, '../templates/emails/otpEmail.ejs'),
      {
        otp,
        expiryMinutes: 1,
      },
    );
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Verify your BuildaPC account',
      html: emailHtml,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
async function sendContactEmail({ name, email, subject, message }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      connectionTimeout: 15000,
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      replyTo: email,
      subject: `BuildaPC Contact: ${subject}`,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}

        Message:
        ${message}
            `,
    });
    return true;
  } catch (error) {
    console.error('Contact email error:', error);
    return false;
  }
}
module.exports = {
  sendVerificationEmail,
  sendContactEmail,
};
