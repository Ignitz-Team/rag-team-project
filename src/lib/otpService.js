import dotenv from "dotenv";
import nodemailer from "nodemailer";
import pkg from "twilio";
const { Twilio } = pkg;

dotenv.config();

const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
const smsConfigured = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  if (!emailConfigured) {
    throw new Error("SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env.");
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendOtpEmail(to, otp) {
  const transport = getTransporter();
  const subject = "Your Life Lens AI verification code";
  const html = `
    <p>Use the following OTP to complete your registration:</p>
    <h2 style="font-family:Arial,sans-serif;">${otp}</h2>
    <p>This code expires in ${process.env.OTP_TTL_MINUTES || 15} minutes.</p>
  `;

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export async function sendOtpSms(to, otp) {
  if (!smsConfigured) {
    throw new Error("Twilio configuration is missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env.");
  }

  const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    body: `Your Life Lens AI verification code is ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
}
