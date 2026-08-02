import { PublicTracker } from "./public-tracker";

export const dynamic = "force-dynamic";

export default function PublicTrackPage({ params }: { params: { shareToken: string } }) {
  return <PublicTracker shareToken={params.shareToken} />;
}
