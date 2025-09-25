// app/privacy/page.tsx
import React from "react";
import PolicyLayout from "@/components/PolicyLayout";
import Accordion from "@/components/Accordion";

const toc = [
  { id: "collect", title: "What we collect" },
  { id: "use", title: "How we use it" },
  { id: "cookies", title: "Cookies" },
  { id: "security", title: "Security & Retention" },
];

export default function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" intro="We value your privacy. This policy explains what information we collect and how we use it." toc={toc}>
      <Accordion id="collect" title="What Information We Collect" defaultOpen>
        <p>We collect data you provide (name, email, payment details) and technical information (IP, device, cookies).</p>
      </Accordion>

      <Accordion id="use" title="How We Use Data">
        <p>We use data to provide services, process payments, send transactional emails, and improve our product. We do not sell personal data.</p>
      </Accordion>

      <Accordion id="cookies" title="Cookies & Tracking">
        <p>We use cookies for authentication and analytics. You can disable non-essential cookies via your browser settings.</p>
      </Accordion>

      <Accordion id="security" title="Security & Retention">
        <p>We follow reasonable security practices (TLS in transit, hashed passwords). We retain data for business and legal purposes as necessary.</p>
      </Accordion>
    </PolicyLayout>
  );
}
