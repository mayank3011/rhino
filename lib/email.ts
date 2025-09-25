// lib/email.ts
import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.EMAIL_FROM || "mayankrajpu3012@gmail.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not set — emails will not be sent.");
}

/**
 * sendVerificationEmail
 * - to: recipient email
 * - registration: object (used to build message)
 * - action: "verified" | "rejected"
 * - admin: admin identifier (string)
 * - notes: optional admin notes
 *
 * Returns: { ok: boolean, resp?: any, error?: string }
 */
export async function sendVerificationEmail(
  to: string,
  registration: any,
  action: "verified" | "rejected",
  admin: string,
  notes?: string
) {
  if (!SENDGRID_API_KEY) {
    return { ok: false, error: "no_sendgrid_api_key" };
  }
  if (!to) {
    return { ok: false, error: "missing_to_address" };
  }

  const subject =
    action === "verified"
      ? `Your registration for "${registration.course}" is confirmed`
      : `Your registration for "${registration.course}" was rejected`;

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial;">
      <h2>${action === "verified" ? "Payment verified ✅" : "Registration rejected ❌"}</h2>
      <p>Hi ${registration.name ?? "Student"},</p>
      <p>Your registration for <strong>${registration.course}</strong> (amount: ₹${Number(
    registration.amount ?? 0
  ).toLocaleString()}) has been <strong>${action}</strong> by ${admin}.</p>
      ${notes ? `<p><strong>Admin notes:</strong><br/>${notes}</p>` : ""}
      <p>Transaction ID: <strong>${registration.paymentProof?.txnId ?? "—"}</strong></p>
      ${
        registration.paymentProof?.screenshot
          ? `<p><a href="${registration.paymentProof.screenshot}" target="_blank" rel="noopener">View payment screenshot</a></p>`
          : ""
      }
      <p style="margin-top:18px;">Regards,<br/>Team</p>
    </div>
  `;

  const msg = {
    to,
    from: FROM,
    subject,
    html,
    // plain text fallback
    text: `Your registration for "${registration.course}" has been ${action}. Transaction ID: ${
      registration.paymentProof?.txnId ?? "—"
    }`,
  };

  try {
    // sgMail.send returns an array of responses
    const resp = await sgMail.send(msg);
    // Log status for debugging
    console.log("SendGrid send OK:", resp?.[0]?.statusCode, resp?.[0]?.headers);
    return { ok: true, resp };
  } catch (err: any) {
    console.error("SendGrid send error (full):");
    if (err && err.response && err.response.body) {
      console.error("SendGrid body:", JSON.stringify(err.response.body, null, 2));
    } else {
      console.error(err);
    }
    return { ok: false, error: err?.message ?? String(err) };
  }
}
export async function sendWelcomeEmail(to: string, opts: { passwordPlain: string; name?: string; sourceInfo?: any }) {
  if (!process.env.SENDGRID_API_KEY) return { ok: false, error: "no_sendgrid" };
  const from = process.env.EMAIL_FROM || "no-reply@example.com";
  const name = opts.name ?? "";
  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial;">
      <h2>Welcome to RhinoGeeks — your student account</h2>
      <p>Hi ${name || "Student"},</p>
      <p>An account has been created for you so you can access course materials and the student dashboard.</p>
      <p><strong>Login</strong>: ${to}</p>
      <p><strong>Temporary password</strong>: <code>${opts.passwordPlain}</code></p>
      <p><strong>Important:</strong> For security, please change your password after logging in. If you did not expect this account, contact support.</p>
      <p>Regards,<br/>Team</p>
    </div>
  `;

  const msg = {
    to,
    from,
    subject: "Welcome — your student account",
    html,
    text: `Welcome. Login: ${to}\nTemporary password: ${opts.passwordPlain}\nPlease change your password after logging in.`,
  };

  try {
    const resp = await sgMail.send(msg);
    return { ok: true, resp };
  } catch (err: any) {
    console.error("sendWelcomeEmail error:", err);
    if (err?.response?.body) console.error("sendgrid body:", JSON.stringify(err.response.body));
    return { ok: false, error: String(err?.message ?? err) };
  }
}