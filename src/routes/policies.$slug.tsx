import { createFileRoute, notFound } from "@tanstack/react-router";

const policies: Record<
  string,
  { title: string; updated: string; sections: { h: string; p: string }[] }
> = {
  privacy: {
    title: "Privacy Policy",
    updated: "January 2025",
    sections: [
      {
        h: "1. Information we collect",
        p: "We collect only the information needed to process your order and provide customer support: your full name, phone number, delivery address, and email address if provided. Payment information for digital wallets (Easypaisa, JazzCash) is never stored on our servers.",
      },
      {
        h: "2. How we use your information",
        p: "Your information is used to process your order, arrange delivery, confirm your purchase via call or WhatsApp, and — with your consent — send you updates about new products. We never sell your personal information to third parties.",
      },
      {
        h: "3. Data retention",
        p: "Order records are kept for accounting and warranty purposes. You may request deletion of your personal data at any time by contacting us on WhatsApp or email.",
      },
      {
        h: "4. Your rights",
        p: "You have the right to access, correct or delete your personal information. To exercise these rights, contact us directly via the Contact page.",
      },
      {
        h: "5. Cookies",
        p: "We use essential cookies to keep your cart working and analytical cookies (with your consent) to improve our website. You can disable non-essential cookies in your browser settings at any time.",
      },
    ],
  },

  terms: {
    title: "Terms of Service",
    updated: "January 2025",
    sections: [
      {
        h: "1. Acceptance",
        p: "By placing an order with Timera you agree to these terms in full.",
      },
      {
        h: "2. Products and pricing",
        p: "All prices are displayed in Pakistani Rupees (PKR) and are inclusive of applicable taxes. Prices may change without notice but any confirmed order will be honoured at the price shown at the time of ordering.",
      },
      {
        h: "3. Order confirmation",
        p: "An order is confirmed once our team calls or WhatsApps you to verify the details. We reserve the right to cancel any order if the item is unavailable.",
      },
      {
        h: "4. Cash on Delivery",
        p: "COD is available across Pakistan. Please ensure someone is available to receive and pay for the package at the delivery address. If a delivery is refused without prior notice, re-delivery charges may apply.",
      },
      {
        h: "5. Governing law",
        p: "These terms are governed by the laws of the Islamic Republic of Pakistan.",
      },
    ],
  },

  shipping: {
    title: "Shipping Policy",
    updated: "January 2025",
    sections: [
      {
        h: "Delivery across Pakistan",
        p: "We deliver to all cities and towns across Pakistan — including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Multan, Peshawar and beyond. If you are unsure about delivery to your area, WhatsApp us before ordering.",
      },
      {
        h: "Delivery timeframe",
        p: "Orders are dispatched within 24 hours of confirmation. Delivery typically takes 2–4 business days depending on your city and courier availability. Remote areas may take 1–2 days longer.",
      },
      {
        h: "Shipping charges",
        p: "A standard delivery charge applies to all orders. Delivery is free on orders above a certain order value — the current threshold is shown at checkout. Cash on Delivery is available at a small additional handling fee.",
      },
      {
        h: "Order tracking",
        p: "Once your order is dispatched, our team will share a tracking number via WhatsApp or call so you can follow your shipment.",
      },
      {
        h: "Packaging",
        p: "Every Timera order is packed in a premium gift box with a warranty card. The outer packaging is designed to protect your watch during transit.",
      },
    ],
  },

  refund: {
    title: "Return & Refund Policy",
    updated: "January 2025",
    sections: [
      {
        h: "7-day return window",
        p: "If you receive a defective, damaged or incorrect item, contact us within 7 days of delivery via WhatsApp or phone. We will arrange a collection and send a replacement or issue a refund at no additional cost to you.",
      },
      {
        h: "Conditions for return",
        p: "The watch must be in its original condition — unworn, with the original packaging, warranty card and all accessories included. Watches showing signs of use, scratches or damage caused after delivery are not eligible for return.",
      },
      {
        h: "Refund process",
        p: "Refunds are processed within 5–7 business days after we receive and inspect the returned item. Refunds are issued to the original payment method (bank transfer or mobile wallet). COD orders are refunded via bank transfer.",
      },
      {
        h: "Exchanges",
        p: "If you would prefer a different colour or model, contact us within 7 days. Exchange availability depends on current stock.",
      },
      {
        h: "How to start a return",
        p: "Send us a WhatsApp message with your order number, a photo of the item and a brief description of the issue. Our team will respond within 24 hours.",
      },
    ],
  },

  warranty: {
    title: "Warranty Policy",
    updated: "January 2025",
    sections: [
      {
        h: "1-Year manufacturer's warranty",
        p: "Every Timera timepiece comes with a 1-year manufacturer's warranty against defects in materials and workmanship. A warranty card is included with every order.",
      },
      {
        h: "What is covered",
        p: "The warranty covers manufacturing defects including movement failure, case finishing defects and dial printing issues that arise under normal use.",
      },
      {
        h: "What is not covered",
        p: "The warranty does not cover damage caused by accidents, misuse, unauthorised modifications, water damage beyond the stated resistance rating, or normal wear and tear such as scratches on the crystal or case.",
      },
      {
        h: "How to claim warranty",
        p: "Contact us via WhatsApp or email with your order number and a description or photo of the issue. We will assess the claim and arrange repair or replacement as appropriate.",
      },
      {
        h: "Servicing",
        p: "We recommend servicing your watch every 3–5 years to maintain accuracy. Contact us for servicing guidance.",
      },
    ],
  },

  cookies: {
    title: "Cookie Policy",
    updated: "January 2025",
    sections: [
      {
        h: "What are cookies",
        p: "Cookies are small text files stored on your device when you visit a website. They help us remember your cart and improve your shopping experience.",
      },
      {
        h: "Essential cookies",
        p: "We use essential cookies to keep your cart working and maintain your session. These cannot be disabled as the website will not function correctly without them.",
      },
      {
        h: "Analytical cookies",
        p: "With your consent, we use analytical tools (such as Meta Pixel and Google Analytics) to understand how visitors use our website so we can improve it.",
      },
      {
        h: "Managing cookies",
        p: "You can manage or disable non-essential cookies at any time through your browser settings. This will not affect your ability to browse or place orders.",
      },
    ],
  },
};

export const Route = createFileRoute("/policies/$slug")({
  loader: ({ params }) => {
    const policy = policies[params.slug];
    if (!policy) throw notFound();
    return { policy };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.policy.title ?? "Policy";
    return {
      meta: [
        { title: `${title} — Timera` },
        { name: "description", content: `${title} for Timera — premium watches with cash on delivery across Pakistan.` },
        { property: "og:title", content: `${title} — Timera` },
      ],
    };
  },
  component: PolicyPage,
});

function PolicyPage() {
  const { policy } = Route.useLoaderData() as {
    policy: { title: string; updated: string; sections: { h: string; p: string }[] };
  };

  return (
    <div className="container-luxe max-w-3xl py-16">
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Legal</p>
      <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{policy.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated: {policy.updated}</p>

      <div className="mt-12 space-y-10">
        {policy.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-serif text-2xl">{s.h}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
      </div>

      <div className="mt-16 rounded-2xl border border-border/50 bg-card p-6">
        <p className="font-semibold text-sm">Questions about our policies?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Contact us on WhatsApp or via the Contact page and our team will respond within 24 hours.
        </p>
      </div>
    </div>
  );
}
