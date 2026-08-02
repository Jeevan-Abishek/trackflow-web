export type Locale = "en" | "hi" | "ta";

export const locales: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
];

export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    "nav.liveSessions": "Live sessions",
    "nav.tripHistory": "Trip history",
    "nav.fleet": "Fleet",
    "nav.fleetOps": "Fleet ops",
    "nav.profile": "Profile",
    "nav.developer": "Developer",
    "nav.signOut": "Sign out",
    "landing.title": "Share where you are, live, with one link.",
    "landing.subtitle":
      "TrackFlow turns your browser into a live GPS beacon. Start a session, send the link, and anyone can watch your position move — updated in real time.",
    "landing.cta.start": "Start tracking free",
    "landing.cta.signin": "Sign in",
    "dashboard.startSession": "Start new session",
    "dashboard.noActive": "No active sessions",
    "dashboard.noActiveBody": "Start a new session to get a live tracking link you can send to anyone.",
    "trip.endTrip": "End trip",
    "trip.publicLink": "Public tracking link",
  },
  hi: {
    "nav.liveSessions": "लाइव सत्र",
    "nav.tripHistory": "यात्रा इतिहास",
    "nav.fleet": "फ्लीट",
    "nav.fleetOps": "फ्लीट संचालन",
    "nav.profile": "प्रोफ़ाइल",
    "nav.developer": "डेवलपर",
    "nav.signOut": "साइन आउट",
    "landing.title": "अपनी लाइव लोकेशन एक लिंक से शेयर करें।",
    "landing.subtitle":
      "TrackFlow आपके ब्राउज़र को लाइव GPS बीकन बना देता है। सत्र शुरू करें, लिंक भेजें, और कोई भी आपकी लोकेशन को रीयल-टाइम में देख सकता है।",
    "landing.cta.start": "मुफ़्त में ट्रैकिंग शुरू करें",
    "landing.cta.signin": "साइन इन करें",
    "dashboard.startSession": "नया सत्र शुरू करें",
    "dashboard.noActive": "कोई सक्रिय सत्र नहीं",
    "dashboard.noActiveBody": "किसी को भी भेजने के लिए लाइव ट्रैकिंग लिंक पाने हेतु नया सत्र शुरू करें।",
    "trip.endTrip": "यात्रा समाप्त करें",
    "trip.publicLink": "सार्वजनिक ट्रैकिंग लिंक",
  },
  ta: {
    "nav.liveSessions": "நேரடி அமர்வுகள்",
    "nav.tripHistory": "பயண வரலாறு",
    "nav.fleet": "வாகனங்கள்",
    "nav.fleetOps": "வாகன செயல்பாடுகள்",
    "nav.profile": "சுயவிவரம்",
    "nav.developer": "டெவலப்பர்",
    "nav.signOut": "வெளியேறு",
    "landing.title": "உங்கள் இருப்பிடத்தை ஒரே இணைப்பில் நேரலையில் பகிரவும்.",
    "landing.subtitle":
      "TrackFlow உங்கள் உலாவியை நேரடி GPS பீக்கனாக மாற்றுகிறது. அமர்வைத் தொடங்கி, இணைப்பை அனுப்புங்கள் — யார் வேண்டுமானாலும் நேரடியாகப் பார்க்கலாம்.",
    "landing.cta.start": "இலவசமாகத் தொடங்குங்கள்",
    "landing.cta.signin": "உள்நுழைக",
    "dashboard.startSession": "புதிய அமர்வைத் தொடங்கு",
    "dashboard.noActive": "செயலில் அமர்வுகள் இல்லை",
    "dashboard.noActiveBody": "யாருக்கும் அனுப்பக்கூடிய நேரடி இணைப்பைப் பெற புதிய அமர்வைத் தொடங்குங்கள்.",
    "trip.endTrip": "பயணத்தை முடிக்கவும்",
    "trip.publicLink": "பொது கண்காணிப்பு இணைப்பு",
  },
};

export function translate(locale: Locale, key: string): string {
  return dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
}
