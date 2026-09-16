import nodemailer from "nodemailer";

let transporter = null;

const isConfigured = () =>
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

const getTransporter = () => {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// Sends an email if SMTP is configured. If not, it just logs to the console
// instead of crashing — email is optional, everything else still works.
export const sendMail = async ({ to, subject, html }) => {
  const t = getTransporter();

  if (!t) {
    console.log(`[email skipped — SMTP not configured] Would have sent "${subject}" to ${to}`);
    return;
  }

  try {
    await t.sendMail({
      from: `"AI SupportDesk" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email failed to send:", error.message);
  }
};
