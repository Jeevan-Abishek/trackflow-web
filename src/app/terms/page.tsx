import { StaticPage } from "@/components/static-page";

export default function TermsPage() {
  return (
    <StaticPage title="Terms & conditions">
      <p>
        This is a starting template, not legal advice — replace it with wording reviewed for your jurisdiction
        before launch.
      </p>
      <h3 className="font-medium text-ink">Acceptable use</h3>
      <p>Don't use TrackFlow to track anyone without their knowledge and consent.</p>
      <h3 className="font-medium text-ink">Availability</h3>
      <p>
        The service runs on free-tier infrastructure and is provided as-is, without uptime guarantees, during this
        phase of development.
      </p>
      <h3 className="font-medium text-ink">Changes</h3>
      <p>These terms may change as the product evolves; continued use means you accept the current version.</p>
    </StaticPage>
  );
}
