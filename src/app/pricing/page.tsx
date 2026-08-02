import { StaticPage } from "@/components/static-page";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PricingPage() {
  return (
    <StaticPage title="Pricing">
      <p>TrackFlow runs entirely on free-tier infrastructure today, so it costs nothing to use.</p>
      <Card className="mt-6 max-w-sm">
        <h2 className="font-display text-xl font-semibold">Free</h2>
        <p className="mt-1 text-sm text-ink/60">Everything in this release, no card required.</p>
        <ul className="mt-4 space-y-2 text-sm">
          <li>• Unlimited live tracking sessions</li>
          <li>• Real-time public share links</li>
          <li>• Trip history and live stats</li>
          <li>• Open-map tiles (OpenStreetMap)</li>
        </ul>
        <Link href="/register">
          <Button className="mt-6 w-full">Get started</Button>
        </Link>
      </Card>
    </StaticPage>
  );
}
