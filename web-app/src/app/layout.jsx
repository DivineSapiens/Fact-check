import "./globals.css";

export const metadata = {
  title: "Fact-Check Beacon | Live Rumor Radar & Leaderboard",
  description: "Real-time AI-powered claim verification dashboard powered by Gemini Search Grounding and Firebase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
