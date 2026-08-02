import { StaticPage } from "@/components/static-page";

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy policy">
      <p>
        This is a starting template, not legal advice — replace it with wording reviewed for your jurisdiction
        before launch.
      </p>
      <h3 className="font-medium text-ink">What we store</h3>
      <p>
        Account details (email or phone, name), the trips you start, and the GPS pings your browser sends while a
        trip is active.
      </p>
      <h3 className="font-medium text-ink">Who can see a trip</h3>
      <p>
        Only you, unless you switch a trip's public tracking link on. While it's on, anyone with the link can view
        that trip's live position and stats.
      </p>
      <h3 className="font-medium text-ink">Data control</h3>
      <p>You can end a trip, turn off its link, or delete your account at any time from your profile.</p>
    </StaticPage>
  );
}
