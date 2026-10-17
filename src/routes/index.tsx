import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Shell, btn, panel } from "@/components/Shell";
import { getIpInfo } from "@/lib/ip.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NullShield — IP & VPN Leak Check" },
      { name: "description", content: "See your real public IP address and location to verify your VPN is working." },
      { property: "og:title", content: "NullShield — IP & VPN Leak Check" },
      { property: "og:description", content: "Check your public IP and whether your VPN hides it." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Info = Awaited<ReturnType<typeof getIpInfo>>;

function Index() {
  const fetchIp = useServerFn(getIpInfo);
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      let r = await fetchIp();
      if (!r.ip) {
        try {
          const j = await (await fetch("https://ipwho.is/")).json();
          r = { ip: j.ip, city: j.city, region: j.region, country: j.country, org: j.connection?.isp ?? j.connection?.org };
        } catch {
          /* keep server result */
        }
      }
      setInfo(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="IP & VPN leak check" lead="This is the address websites see. Turn your VPN on, check again — it should change.">
      <section className={panel}>
        <button className={btn} onClick={run} disabled={loading}>
          {loading ? "Checking..." : "Check my IP"}
        </button>
        {info && (
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">IP address</dt><dd className="text-primary">{info.ip || "unknown"}</dd>
            <dt className="text-muted-foreground">Location</dt><dd>{[info.city, info.region, info.country].filter(Boolean).join(", ") || "unknown"}</dd>
            <dt className="text-muted-foreground">Provider</dt><dd>{info.org ?? "unknown"}</dd>
            {info.error && <><dt className="text-destructive">Note</dt><dd className="text-destructive">{info.error}</dd></>}
          </dl>
        )}
        <p className="mt-5 text-xs text-muted-foreground">
          If the location and provider still show your home internet company while your VPN is on, your VPN is not protecting you.
        </p>
      </section>
    </Shell>
  );
}
