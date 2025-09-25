// app/terms/page.tsx
import React from "react";
import PolicyLayout from "@/components/PolicyLayout";
import Accordion from "@/components/Accordion";

const toc = [
  { id: "acceptance", title: "Acceptance" },
  { id: "accounts", title: "Accounts" },
  { id: "payments", title: "Payments & Refunds" },
  { id: "content", title: "Content & Licenses" },
  { id: "limits", title: "Limitations" },
  { id: "governing", title: "Governing Law" },
];

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service" intro="Please read these terms carefully before using our service." toc={toc}>
      <Accordion id="acceptance" title="1. Acceptance of Terms" defaultOpen>
        <p>By accessing or using our website and services you agree to be bound by these Terms. If you do not agree, please do not use the services.</p>
      </Accordion>

      <Accordion id="accounts" title="2. Accounts & Eligibility">
        <p>You must provide accurate information and maintain your account security. You are responsible for activity on your account.</p>
        <ul className="list-disc pl-5 mt-3">
          <li>Keep credentials confidential.</li>
          <li>Notify us of unauthorized activity promptly.</li>
        </ul>
      </Accordion>

      <Accordion id="payments" title="3. Payments, Pricing & Refunds">
        <p>Pricing for courses is shown on the site. Payments are processed through third-party providers. Refunds follow our refund policy.</p>
      </Accordion>

      <Accordion id="content" title="4. Content, License & Restrictions">
        <p>All course materials are owned by us or our licensors. We grant you a limited, non-exclusive license to access the content for personal, non-commercial use.</p>
      </Accordion>

      <Accordion id="limits" title="5. Limitation of Liability">
        <p>To the extent permitted by law, our liability is limited. We are not responsible for indirect or consequential damages.</p>
      </Accordion>

      <Accordion id="governing" title="6. Governing Law & Changes">
        <p>These Terms are governed by the laws of the jurisdiction in which the business is registered. We may update terms; material changes will be communicated to users.</p>
      </Accordion>
    </PolicyLayout>
  );
}
