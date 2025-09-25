// scripts/sg-debug-send.js
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function main() {
  const to = process.env.SMTP_TEST_TO || process.env.SMTP_USER;
  const from = process.env.EMAIL_FROM;

  if (!to || !from) {
    console.error("Set SMTP_TEST_TO and EMAIL_FROM in .env.local");
    process.exit(1);
  }

  const msg = {
    to:"mayankyuir@gmail.com",
    from:"mayankrajpu3012@gmail.com",
    subject: "SendGrid debug test",
    text: "Test text",
    html: "<p>Test html</p>",
  };

  try {
    const resp = await sgMail.send(msg);
    console.log("Send OK:", resp && resp[0] && resp[0].statusCode);
  } catch (err) {
    // Print everything SendGrid gives us
    console.error("SendGrid error (full):");
    if (err.response) {
      console.error("statusCode:", err.code || err.response.statusCode);
      console.error("headers:", err.response.headers);
      try {
        console.error("body:", JSON.stringify(err.response.body, null, 2));
      } catch (e) {
        console.error("body raw:", err.response.body);
      }
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
