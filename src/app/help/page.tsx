import { StaticPage } from "@/components/static-page";

const faqs = [
  {
    q: "How do I share my live location?",
    a: "Sign in, start a new session from your dashboard, then switch on the public tracking link and send it however you like.",
  },
  {
    q: "Can I stop sharing at any time?",
    a: "Yes. Turn off the public tracking link toggle, or end the trip entirely — the link stops working immediately.",
  },
  {
    q: "Does the person watching need an account?",
    a: "No. Anyone with the link can open it in a browser and watch your position update live.",
  },
  {
    q: "Why did my position stop updating?",
    a: "Check that location permission is still granted to your browser and that the tab sharing your position is open and online.",
  },
];

export default function HelpPage() {
  return (
    <StaticPage title="Help center">
      <div className="space-y-6">
        {faqs.map((f) => (
          <div key={f.q}>
            <h3 className="font-medium text-ink">{f.q}</h3>
            <p className="mt-1">{f.a}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
