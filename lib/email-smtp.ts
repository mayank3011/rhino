// lib/email-smtp.ts (optional)
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true", // false for STARTTLS
  auth: {
    user: process.env.SMTP_USER || "apikey",
    pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
  },
});

export async function sendVerificationEmailSMTP(to: string, registration: any, action: "verified" | "rejected", admin: string, notes?: string) {
  const subject = action === "verified"
    ? `Your registration for "${registration.course}" is confirmed`
    : `Your registration for "${registration.course}" was rejected`;

  const html = `...`; // same as previous example

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    return { ok: true, info };
  } catch (err: any) {
    console.error("send smtp error", err);
    return { ok: false, error: err?.message ?? String(err) };
  }
}
