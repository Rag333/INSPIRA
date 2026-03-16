const nodemailer = require('nodemailer');

let transporter;

// Initialize the transporter
const initTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false // Helps in some restrictive environments
      }
    });
  } else {
    // Generate a temporary Ethereal account for testing
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
    console.log('NOTICE: No EMAIL_USER and EMAIL_PASS set in .env.');
    console.log('Created a temporary Ethereal Email account for testing.');
  }
};

initTransporter();

/**
 * Sends an email with the OTP
 * @param {string} to - Recipient email address
 * @param {string} otp - The generated OTP
 */
const sendOTPEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Inspira Test System" <test@inspira.com>',
      to,
      subject: 'INSPIRA - Verify Your Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Welcome to INSPIRA!</h2>
          <p style="font-size: 16px; color: #555;">To complete your registration, please verify your email address using the One-Time Password (OTP) below.</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #777;">This OTP is valid for 5 minutes. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    
    // If using Ethereal, print the URL where the user can view the email
    if (!process.env.EMAIL_USER) {
        console.log(`\n=========================================`);
        console.log(`TEST EMAIL DELIVERED TO ETHEREAL!`);
        console.log(`Open this link in your browser to view the email:`);
        console.log(nodemailer.getTestMessageUrl(info));
        console.log(`=========================================\n`);
    }
    
    // Return both the success status and the preview URL
    return { success: true, previewUrl: !process.env.EMAIL_USER ? nodemailer.getTestMessageUrl(info) : null };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false };
  }
};

module.exports = {
  sendOTPEmail,
};
