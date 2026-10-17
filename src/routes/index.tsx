import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NullShield — Security Toolkit" },
      { name: "description", content: "Demo VPN panel, port scanner and packet viewer in one security dashboard." },
      { property: "og:title", content: "NullShield — Security Toolkit" },
      { property: "og:description", content: "Demo VPN, port scanner and packet viewer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-lg border border-border bg-card p-5">
    <h2 className="mb-4 text-lg font-bold text-primary">&gt; {title}</h2>
    {children}
  </section>
);
const btn = "rounded border border-primary px-4 py-2 text-primary hover:bg-primary hover:text-primary-foreground";

function Vpn() {
  const [on, setOn] = useState(false);
  const [loc, setLoc] = useState("Stockholm");
  return (
    <Card title="VPN (demo)">
      <select value={loc} onChange={(e) => setLoc(e.target.value)} className="mb-3 w-full rounded border border-border bg-muted p-2">
        {["Stockholm", "Frankfurt", "New York", "Tokyo"].map((l) => <option key={l}>{l}</option>)}
      </select>
      <button className={btn} onClick={() => setOn(!on)}>{on ? "Disconnect" : "Connect"}</button>
      <p className={`mt-3 text-sm ${on ? "text-primary" : "text-destructive"}`}>
        {on ? `● Connected · ${loc} · 10.8.0.${Math.floor(Math.random() * 200)}` : "● Not protected"}
      </p>
    </Card>
  );
}

const PORTS: [number, string][] = [[21,"ftp"],[22,"ssh"],[25,"smtp"],[53,"dns"],[80,"http"],[443,"https"],[3306,"mysql"],[8080,"http-alt"]];
function Scanner() {
  const [host, setHost] = useState("scanme.example");
  const [out, setOut] = useState<string[]>([]);
  const scan = () => {
    const lines = [`Starting scan of ${host}...`, "PORT     STATE   SERVICE"];
    PORTS.forEach(([p, s]) => lines.push(`${String(p).padEnd(8)} ${(Math.random() > 0.5 ? "open" : "closed").padEnd(7)} ${s}`));
    lines.push("Scan done (simulated).");
    setOut(lines);
  };
  return (
    <Card title="Port scanner (demo)">
      <div className="flex gap-2">
        <input value={host} onChange={(e) => setHost(e.target.value)} className="flex-1 rounded border border-border bg-muted p-2" />
        <button className={btn} onClick={scan}>Scan</button>
      </div>
      <pre className="mt-3 h-48 overflow-auto rounded bg-muted p-3 text-xs">{out.join("\n")}</pre>
    </Card>
  );
}

function Packets() {
  const [rows, setRows] = useState<string[][]>([]);
  const capture = () => {
    const protos = ["TCP", "UDP", "DNS", "HTTP", "TLS"];
    setRows(Array.from({ length: 12 }, (_, i) => [String(i + 1), `192.168.1.${10 + i}`, `10.0.0.${i * 3 + 1}`, protos[i % 5], `${60 + i * 37} bytes`]));
  };
  return (
    <Card title="Packet viewer (demo)">
      <button className={btn} onClick={capture}>Start capture</button>
      <table className="mt-3 w-full text-left text-xs">
        <thead className="text-muted-foreground"><tr>{["#", "Source", "Dest", "Proto", "Len"].map((h) => <th key={h} className="p-1">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]} className="border-t border-border">{r.map((c, j) => <td key={j} className="p-1">{c}</td>)}</tr>)}</tbody>
      </table>
    </Card>
  );
}

function Index() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-4xl font-bold text-primary">NullShield_</h1>
      <p className="mb-6 text-muted-foreground">Your security toolkit. All tools here are browser demos with simulated results. For real use, install WireGuard, Nmap and Wireshark.</p>
      <div className="grid gap-5 md:grid-cols-2">
        <Vpn /><Scanner />
        <div className="md:col-span-2"><Packets /></div>
      </div>
    </main>
  );
}
