// app/api/contact/route.ts
import { NextResponse } from "next/server";

// Types for better type safety
interface ContactFormData {
  name?: string;
  email?: string;
  message?: string;
}

interface EmailParams {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}


interface SMTPMailOptions {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

interface ContactResponse {
  ok?: boolean;
  via?: string;
  message?: string;
  error?: string;
  details?: string;
}

async function trySendWithSendGrid({ from, to, subject, text, html }: EmailParams): Promise<unknown> {
  const sg = await import("@sendgrid/mail");
  const sgMail = sg.default;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error("SendGrid key missing");
  
  sgMail.setApiKey(key);
  
  const msg = {
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };

  const resp = await sgMail.send(msg);
  return resp;
}

async function trySendWithSMTP({ from, to, subject, text, html }: EmailParams): Promise<unknown> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: (process.env.SMTP_SECURE === "true"),
    auth: process.env.SMTP_USER ? { 
      user: process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS 
    } : undefined,
  });

  const mailOptions: SMTPMailOptions = {
    from,
    to,
    subject,
    text,
  };
  
  if (html) {
    mailOptions.html = html;
  }

  const info = await transporter.sendMail(mailOptions);
  return info;
}

function escapeHtml(s: string): string {
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

export async function POST(req: Request): Promise<NextResponse<ContactResponse>> {
  try {
    const body: ContactFormData = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "name, email and message are required" }, 
        { status: 422 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" }, 
        { status: 422 }
      );
    }

    // Build email
    const siteOwnerEmail = process.env.EMAIL_FROM ?? 
                          process.env.SENDGRID_FROM ?? 
                          "no-reply@rhinogeeks.com";
    const subject = `Contact form: ${name} (${email})`;
    const text = `Contact form submission

Name: ${name}
Email: ${email}

Message:
${message}

--
Sent from RhinoGeeks website.`;

    const html = `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px;">
        <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #667eea; margin: 0 0 20px 0; font-size: 24px;">New Contact Form Submission</h2>
          
          <div style="background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 8px 0; color: #374151;"><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          </div>
          
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Message:</p>
            <div style="white-space: pre-wrap; color: #374151; line-height: 1.6;">${escapeHtml(message)}</div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Sent from <strong style="color: #667eea;">RhinoGeeks</strong> website
            </p>
          </div>
        </div>
      </div>
    `;

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        await trySendWithSendGrid({ from: siteOwnerEmail, to: siteOwnerEmail, subject, text, html });
        return NextResponse.json({ ok: true, via: "sendgrid" });
      } catch (error) {
        console.error("SendGrid send failed:", error);
        const err = error as Error;
        console.error("Error details:", err?.message ?? err);
        // fall through to SMTP if configured
      }
    }

    // Try SMTP via Nodemailer
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await trySendWithSMTP({ from: siteOwnerEmail, to: siteOwnerEmail, subject, text, html });
        return NextResponse.json({ ok: true, via: "smtp" });
      } catch (error) {
        console.error("SMTP send failed:", error);
        const err = error as Error;
        return NextResponse.json(
          { 
            error: "Email delivery failed", 
            details: String(err?.message ?? err) 
          }, 
          { status: 500 }
        );
      }
    }

    // If no email provider configured, log and respond
    console.warn("No email provider configured. Contact message:", { name, email, message });
    return NextResponse.json({ 
      ok: true, 
      via: "log-only", 
      message: "No email provider configured. Message logged." 
    });

  } catch (error) {
    console.error("Contact API error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: String(err?.message ?? err) }, 
      { status: 500 }
    );
  }
}