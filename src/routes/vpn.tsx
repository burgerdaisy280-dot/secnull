import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, panel } from "@/components/Shell";

export const Route = createFileRoute("/vpn")({
  head: () => ({
    meta: [
      { title: "NullShield — VPN Setup Guide" },
      { name: "description", content: "Step-by-step guide to setting up a real WireGuard VPN and verifying it works." },
      { property: "og:title", content: "NullShield — VPN Setup Guide" },
      { property: "og:description", content: "Set up WireGuard and confirm your IP is hidden." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vpn,
});

const steps = [
  { t: "Pick a VPN provider", d: "Choose a provider that supports WireGuard (e.g. Mullvad, Proton VPN, IVPN), or run your own server." },
  { t: "Install WireGuard", d: "Download the official app from wireguard.com/install for Windows, macOS, Linux, iOS or Android." },
  { t: "Get a config file", d: "In your provider's account page, generate a WireGuard configuration (.conf) for the server location you want." },
  { t: "Import & connect", d: "Open WireGuard → Import tunnel from file → select the .conf → Activate." },
  { t: "Verify", d: "Open the IP check page here. Your IP and provider should now show the VPN, not your home internet." },
];

function Vpn() {
  return (
    <Shell title="VPN setup guide" lead="A website can't be a VPN itself — but you can set up a real one in about five minutes.">
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={s.t} className={panel}>
            <h2 className="font-bold text-primary">{i + 1}. {s.t}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>
      <Link to="/" className="mt-6 inline-block text-primary underline">Go to IP check →</Link>
    </Shell>
  );
}
