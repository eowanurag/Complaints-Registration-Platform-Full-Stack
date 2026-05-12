import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_SENDER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_SENDER,
      to,
      subject: 'Your Registration OTP - Complaints Registration Platform',
      text: `Your One-Time Password (OTP) for registration is: ${otp}\nThis code will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${to}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send email');
  }
}
