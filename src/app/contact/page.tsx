import { StaticPage } from "@/components/static-page";

export default function ContactPage() {
  return (
    <StaticPage title="Contact">
      <p>Have a question or found a bug? Reach out and we'll get back to you.</p>
      <p>
        Email: <a className="text-brand-500" href="mailto:support@trackflow.app">support@trackflow.app</a>
      </p>
      <p className="text-xs text-ink/40">Replace this address with your own before deploying to production.</p>
    </StaticPage>
  );
}
