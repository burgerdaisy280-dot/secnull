import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Shell, btn, field, panel } from "@/components/Shell";
import { scanHost } from "@/lib/scan.functions";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "NullShield — Port Scanner" },
      { name: "description", content: "Check which common ports are open on a server you own." },
      { property: "og:title", content: "NullShield — Port Scanner" },
      { property: "og:description", content: "Real TCP port scan of common services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Scanner,
});

type Result = Awaited<ReturnType<typeof scanHost>>;

function Scanner() {
  const scan = useServerFn(scanHost);
  const [host, setHost] = useState("scanme.nmap.org");
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setErr("");
    setRes(null);
    try {
      setRes(await scan({ data: { host } }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title="Port scanner" lead="Real connection test of 18 common ports. Only scan servers you own or have permission to test.">
      <section className={panel}>
        <div className="flex gap-2">
          <input className={field} value={host} onChange={(e) => setHost(e.target.value)} placeholder="example.com" />
          <button className={btn} onClick={run} disabled={loading}>{loading ? "Scanning..." : "Scan"}</button>
        </div>
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        {res && (
          <table className="mt-5 w-full text-left text-sm">
            <thead className="text-muted-foreground"><tr><th className="p-1">Port</th><th className="p-1">State</th><th className="p-1">Service</th></tr></thead>
            <tbody>
              {res.results.map((r) => (
                <tr key={r.port} className="border-t border-border">
                  <td className="p-1">{r.port}</td>
                  <td className={`p-1 ${r.state === "open" ? "text-primary" : "text-muted-foreground"}`}>{r.state}</td>
                  <td className="p-1">{r.service}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}
