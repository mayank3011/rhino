// scripts/send-test-sendgrid-min.js
require("dotenv").config();
const sg = require("@sendgrid/mail");
sg.setApiKey(process.env.SENDGRID_API_KEY);

async function run() {
  try {
    const msg = {
      to: process.env.SMTP_TEST_TO || process.env.SMTP_USER,
      from: process.env.EMAIL_FROM, // must be verified single sender or domain-authenticated
      subject: "Hello from SendGrid (test)",
      text: "If you see this, SendGrid send worked.",
      html: "<strong>If you see this, SendGrid send worked.</strong>"
    };
    const res = await sg.send(msg);
    console.log("OK", res[0].statusCode);
  } catch (e) {
    if (e.response && e.response.body) {
      console.error("Error body:", JSON.stringify(e.response.body, null, 2));
    } else {
      console.error(e);
    }
  }
}

run();
