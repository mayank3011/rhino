// lib/email.ts
import sgMail, { MailDataRequired, ResponseError } from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.EMAIL_FROM || "mayankrajpu3012@gmail.com";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("SENDGRID_API_KEY not set — emails will not be sent.");
}

// Types for better type safety
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

interface EmailResponse {
  ok: boolean;
  resp?: unknown[]; // normalised SendGrid response (unknown[] avoids `any`)
  error?: string;
}

interface WelcomeEmailOptions {
  passwordPlain: string;
  name?: string;
  sourceInfo?: Record<string, unknown>;
}

/**
 * Normalizes the value returned by sgMail.send() into an unknown[].
 * sgMail.send() sometimes returns a tuple like [ClientResponse, {}]
 * or an array of ClientResponse. We keep it typed as unknown[] to be safe.
 */
function normalizeSendgridResponse(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  // fallback: wrap single value
  return [value];
}

/**
 * sendVerificationEmail
 * - to: recipient email
 * - registration: registration object
 * - action: "verified" | "rejected"
 * - admin: admin identifier
 * - notes: optional admin notes
 */
export async function sendVerificationEmail(
  to: string,
  registration: Registration,
  action: "verified" | "rejected",
  admin: string,
  notes?: string
): Promise<EmailResponse> {
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
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #667eea; margin: 0; font-size: 24px; font-weight: 600;">
            ${action === "verified" ? "Payment verified ✅" : "Registration rejected ❌"}
          </h2>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Hi ${registration.name || "Student"},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Your registration for <strong style="color: #667eea;">${registration.course}</strong> 
          (amount: <span style="color: #10b981; font-weight: 600;">₹${Number(registration.amount || 0).toLocaleString()}</span>) 
          has been <strong style="color: ${action === "verified" ? "#10b981" : "#ef4444"};">${action}</strong> by ${admin}.
        </p>
        
        ${notes ? `
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea; margin: 16px 0;">
            <p style="margin: 0; color: #374151; font-size: 14px;">
              <strong style="color: #667eea;">Admin notes:</strong><br/>
              ${notes}
            </p>
          </div>
        ` : ""}
        
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            <strong>Transaction ID:</strong> <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px; font-family: 'Courier New', monospace;">${registration.paymentProof?.txnId || "—"}</code>
          </p>
          ${registration.paymentProof?.screenshot ? `
            <p style="margin: 8px 0 0 0;">
              <a href="${registration.paymentProof.screenshot}" 
                 target="_blank" 
                 rel="noopener" 
                 style="color: #667eea; text-decoration: none; font-size: 14px;">
                📷 View payment screenshot
              </a>
            </p>
          ` : ""}
        </div>
        
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Regards,<br/>
            <strong style="color: #667eea;">RhinoGeeks Team</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  const msg: MailDataRequired = {
    to,
    from: FROM,
    subject,
    html,
    text: `Your registration for "${registration.course}" has been ${action}. Transaction ID: ${registration.paymentProof?.txnId || "—"}`,
  };

  try {
    const rawResp = await sgMail.send(msg);
    const resp = normalizeSendgridResponse(rawResp);
    // log some safe info if available
    if (resp.length > 0) {
      const first = resp[0] as unknown;
      // try to read statusCode and headers if present (guarded)
      try {
        const maybeStatus = (first as { statusCode?: unknown }).statusCode;
        if (typeof maybeStatus === "number") {
          console.log("SendGrid send OK:", maybeStatus);
        }
      } catch {
        // ignore
      }
    }
    return { ok: true, resp };
  } catch (error) {
    console.error("SendGrid send error (full):");
    const err = error as ResponseError | unknown;
    if (typeof err === "object" && err !== null) {
      const e = err as ResponseError;
      if (e.response && typeof e.response === "object") {
        try {
          // e.response.body could be object or array; stringify safely
          const responseObj = e.response as unknown;
          const body = typeof responseObj === "object" && responseObj !== null && "body" in responseObj
            ? (responseObj as { body?: unknown }).body
            : undefined;
          console.error("SendGrid body:", JSON.stringify(body ?? e.response.body, null, 2));
        } catch {
          console.error("SendGrid response body (non-serializable)");
        }
      } else {
        console.error(err);
      }
      return { ok: false, error: (e.message && String(e.message)) || "sendgrid_error" };
    } else {
      return { ok: false, error: String(err) };
    }
  }
}

export async function sendWelcomeEmail(
  to: string,
  opts: WelcomeEmailOptions
): Promise<EmailResponse> {
  if (!process.env.SENDGRID_API_KEY) {
    return { ok: false, error: "no_sendgrid" };
  }

  const from = process.env.EMAIL_FROM || "no-reply@rhinogeeks.com";
  const name = opts.name || "";

  const html = `
    <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #667eea; margin: 0; font-size: 24px; font-weight: 600;">
            Welcome to RhinoGeeks 🚀
          </h2>
          <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">Your student account is ready!</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
          Hi ${name || "Student"},
        </p>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          An account has been created for you so you can access course materials and the student dashboard.
        </p>
        
        <div style="background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #667eea; margin: 0 0 12px 0; font-size: 18px;">Your Login Credentials</h3>
          <p style="margin: 8px 0; color: #374151; font-size: 14px;">
            <strong>Email:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; border: 1px solid #e5e7eb;">${to}</code>
          </p>
          <p style="margin: 8px 0; color: #374151; font-size: 14px;">
            <strong>Temporary Password:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace; border: 1px solid #e5e7eb; color: #dc2626;">${opts.passwordPlain}</code>
          </p>
        </div>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
            <strong>🔒 Important:</strong> For security, please change your password after logging in. 
            If you did not expect this account, contact support immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Happy Learning!<br/>
            <strong style="color: #667eea;">RhinoGeeks Team</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  const msg: MailDataRequired = {
    to,
    from,
    subject: "Welcome to RhinoGeeks — Your student account",
    html,
    text: `Welcome to RhinoGeeks. Login: ${to}\nTemporary password: ${opts.passwordPlain}\nPlease change your password after logging in.`,
  };

  try {
    const rawResp = await sgMail.send(msg);
    const resp = normalizeSendgridResponse(rawResp);
    return { ok: true, resp };
  } catch (error) {
    console.error("sendWelcomeEmail error:", error);
    const err = error as ResponseError | unknown;
    if (typeof err === "object" && err !== null) {
      const e = err as ResponseError;
      if (e?.response && typeof e.response === "object") {
        try {
          const responseBody = (e.response as { body?: unknown }).body ?? (e.response as { body?: unknown }).body;
          console.error("sendgrid body:", JSON.stringify(responseBody));
        } catch {
          console.error("sendgrid body (non-serializable)");
        }
      }
      return { ok: false, error: (e.message && String(e.message)) || "sendgrid_error" };
    }
    return { ok: false, error: String(err) };
  }
}
