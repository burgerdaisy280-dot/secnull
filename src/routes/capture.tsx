import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, field, panel } from "@/components/Shell";
import { parsePcap, type Packet } from "@/lib/pcap";

export const Route = createFileRoute("/capture")({
  head: () => ({
    meta: [
      { title: "NullShield — Capture File Viewer" },
      { name: "description", content: "Open a Wireshark .pcap capture and inspect the packets in your browser." },
      { property: "og:title", content: "NullShield — Capture File Viewer" },
      { property: "og:description", content: "Inspect real packet captures privately in your browser." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Capture,
});

function Capture() {
  const [packets, setPackets] = useState<Packet[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");

  const onFile = async (file?: File) => {
    if (!file) return;
    setErr("");
    try {
      const r = parsePcap(await file.arrayBuffer());
      setPackets(r.packets);
      setTotal(r.total);
    } catch (e) {
      setPackets([]);
      setErr(e instanceof Error ? e.message : "Could not read file");
    }
  };

  const q = filter.toLowerCase();
  const shown = q ? packets.filter((p) => [p.source, p.destination, p.protocol, p.info].join(" ").toLowerCase().includes(q)) : packets;

  return (
    <Shell title="Capture file viewer" lead="Open a .pcap file saved from Wireshark or tcpdump. The file never leaves your computer.">
      <section className={panel}>
        <input type="file" accept=".pcap,.cap,.pcapng" className={field} onChange={(e) => onFile(e.target.files?.[0])} />
        {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        {packets.length > 0 && (
          <>
            <div className="mt-4 flex items-center gap-3">
              <input className={field} placeholder="Filter (e.g. DNS, 192.168.1.5, 443)" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <span className="shrink-0 text-xs text-muted-foreground">{shown.length} shown · {total} total</span>
            </div>
            <div className="mt-4 max-h-[60vh] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-card text-muted-foreground">
                  <tr>{["No.", "Time", "Source", "Destination", "Protocol", "Length", "Info"].map((h) => <th key={h} className="p-1">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.index} className="border-t border-border">
                      <td className="p-1">{p.index}</td><td className="p-1">{p.time}</td><td className="p-1">{p.source}</td>
                      <td className="p-1">{p.destination}</td><td className="p-1 text-primary">{p.protocol}</td>
                      <td className="p-1">{p.length}</td><td className="p-1">{p.info}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > packets.length && <p className="mt-2 text-xs text-muted-foreground">Showing the first {packets.length} packets.</p>}
          </>
        )}
      </section>
    </Shell>
  );
}
