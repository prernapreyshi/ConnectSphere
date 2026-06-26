const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_USER) {
    console.log(`[Email skipped – no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"ConnectSphere" <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error("Email send error:", err.message);
  }
};

const notificationEmailHTML = (senderName, message, link) => `
<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;color:#1a1a1a">
  <div style="background:#2563eb;padding:16px 24px;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">ConnectSphere</h2>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
    <p style="margin:0 0 12px">Hi there 👋</p>
    <p style="margin:0 0 20px"><strong>${senderName}</strong> ${message}</p>
    <a href="${link}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
      View on ConnectSphere
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">
      You're receiving this because you're a ConnectSphere member.<br/>
      <a href="${process.env.CLIENT_URL}/settings" style="color:#6b7280">Manage notifications</a>
    </p>
  </div>
</body></html>`;

module.exports = { sendEmail, notificationEmailHTML };
