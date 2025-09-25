// lib/email-smtp.ts
import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

const transporter: Transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.sendgrid.net",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "apikey",
    pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
  },
});

// Optional: quick health check / warning if not configured
if (!process.env.SMTP_PASS && !process.env.SENDGRID_API_KEY) {
  console.warn("SMTP credentials not provided — SMTP email may fail to send.");
}

/** Local types used by this module (kept internal and strict) */
interface PaymentProof {
  txnId?: string;
  screenshot?: string;
  verificationNotes?: string;
}

interface Registration {
  name?: string;
  course?: string;
  amount?: number;
  paymentProof?: PaymentProof;
}

interface SMTPEmailResponse {
  ok: boolean;
  info?: nodemailer.SentMessageInfo;
  error?: string;
}

/**
 * sendVerificationEmailSMTP
 * - sends the verification/rejection email via SMTP transporter
 */
export async function sendVerificationEmailSMTP(
  to: string,
  registration: Registration,
  action: "verified" | "rejected",
  admin: string,
  notes?: string
): Promise<SMTPEmailResponse> {
  if (!to) {
    return { ok: false, error: "missing_to_address" };
  }

  const subject =
    action === "verified"
      ? `Your registration for "${registration.course}" is confirmed`
      : `Your registration for "${registration.course}" was rejected`;

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #667eea;">${action === "verified" ? "Payment verified ✅" : "Registration rejected ❌"}</h2>
      <p>Hi ${registration.name || "Student"},</p>
      <p>Your registration for <strong>${registration.course}</strong> (amount: <strong>₹${Number(
        registration.amount ?? 0
      ).toLocaleString()})</strong> has been <strong>${action}</strong> by ${admin}.</p>
      ${notes ? `<div style="margin:12px 0; padding:10px; background:#f3f4f6; border-radius:6px;"><strong>Admin notes:</strong><div>${notes}</div></div>` : ""}
      <p>Transaction ID: <strong>${registration.paymentProof?.txnId ?? "—"}</strong></p>
      ${registration.paymentProof?.screenshot ? `<p><a href="${registration.paymentProof.screenshot}" target="_blank" rel="noopener">View payment screenshot</a></p>` : ""}
      <p style="margin-top: 18px;">Regards,<br/>RhinoGeeks Team</p>
    </div>
  `;

  const mailOptions: SendMailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@rhinogeeks.com",
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { ok: true, info };
  } catch (error) {
    console.error("send smtp error", error);
    // keep typing strict: error is unknown -> narrow to Error if possible
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: String(error) };
  }
}
