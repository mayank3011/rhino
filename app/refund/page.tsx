// app/refund/page.tsx
import React from "react";
import PolicyLayout from "@/components/PolicyLayout";
import Accordion from "@/components/Accordion";

const toc = [
  { id: "overview", title: "Overview" },
  { id: "cases", title: "Typical Cases" },
  { id: "how", title: "How to request" },
  { id: "processors", title: "Processors" },
];

export default function RefundPage() {
  return (
    <PolicyLayout title="Refund Policy" intro="We want you to be satisfied. This policy explains refunds and cancellations." toc={toc}>
      <Accordion id="overview" title="Overview" defaultOpen>
        <p>Refunds are considered on a case-by-case basis. Some payments may be non-refundable.</p>
      </Accordion>

      <Accordion id="cases" title="Typical Cases">
        <ul className="list-disc pl-5">
          <li>Full refund within 48 hours if access not granted.</li>
          <li>Partial refund prorated after start date in some cases.</li>
          <li>No refund where materials have been consumed beyond permitted limits.</li>
        </ul>
      </Accordion>

      <Accordion id="how" title="How to request a refund">
        <ol className="list-decimal pl-5">
          <li>Email support with your order id and reason.</li>
          <li>Provide proof of purchase (receipt/txn id).</li>
          <li>We will respond within 5–7 business days.</li>
        </ol>
      </Accordion>

      <Accordion id="processors" title="Payment processors & timing">
        <p>Refunds issued to the original payment method may take time depending on banks or card providers.</p>
      </Accordion>
    </PolicyLayout>
  );
}
