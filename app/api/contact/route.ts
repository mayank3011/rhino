// app/api/contact/route.ts
import { NextResponse } from "next/server";

/**
 * Contact API
 *
 * - Accepts POST { name, email, message }
 * - Attempts SendGrid if SENDGRID_API_KEY is present
 * - Otherwise uses SMTP via Nodemailer if SMTP_* env vars exist
 *
 * Environment variables:
 * - SENDGRID_API_KEY and SENDGRID_FROM (optional sender)
 * - OR SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

async function trySendWithSendGrid({ from, to, subject, text, html }: { from: string; to: string; subject: string; text: string; html?: string }) {
  // dynamic import to avoid bundling if not used
  const sg = await import("@sendgrid/mail");
  const sgMail = sg.default;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SendGrid key missing");
  sgMail.setApiKey(key);
  const msg: any = {
    from,
    personalizations: [{ to: Array.isArray(to) ? to : [to] }],
    subject,
    content: [{ type: "text/plain", value: text }],
  };
  if (html) msg.content.push({ type: "text/html", value: html });
  // SendGrid accepts 'from' and 'personalizations'
  const resp = await sgMail.send(msg);
  return resp;
}

async function trySendWithSMTP({ from, to, subject, text, html }: { from: string; to: string; subject: string; text: string; html?: string }) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: (process.env.SMTP_SECURE === "true"), // true for 465
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });

  const mailOptions: any = {
    from,
    to,
    subject,
    text,
  };
  if (html) mailOptions.html = html;

  const info = await transporter.sendMail(mailOptions);
  return info;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "name, email and message are required" }, { status: 422 });
    }

    // Build email
    const siteOwnerEmail = process.env.EMAIL_FROM ?? process.env.SENDGRID_FROM ?? "no-reply@yourdomain.com";
    const subject = `Contact form: ${name} (${email})`;
    const text = `Contact form submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n--\nSent from site.`;
    const html = `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><pre style="white-space:pre-wrap">${escapeHtml(message)}</pre>`;

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        await trySendWithSendGrid({ from: siteOwnerEmail, to: siteOwnerEmail, subject, text, html });
        return NextResponse.json({ ok: true, via: "sendgrid" });
      } catch (err: any) {
        console.error("SendGrid send failed:", err?.message ?? err);
        // fall through to SMTP if configured
      }
    }

    // Try SMTP via Nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await trySendWithSMTP({ from: siteOwnerEmail, to: siteOwnerEmail, subject, text, html });
        return NextResponse.json({ ok: true, via: "smtp" });
      } catch (err: any) {
        console.error("SMTP send failed:", err?.message ?? err);
        return NextResponse.json({ error: "Email delivery failed", details: String(err?.message ?? err) }, { status: 500 });
      }
    }

    // If no email provider configured, just log and respond OK (or return error if you prefer)
    console.warn("No email provider configured. Contact message:", { name, email, message });
    // Optionally persist to DB here
    return NextResponse.json({ ok: true, via: "log-only", message: "No email provider configured. Message logged." });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}
