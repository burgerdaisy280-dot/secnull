import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Shell, panel, btn } from "@/components/Shell";
import { getIpInfo } from "@/lib/ip.functions";

export const Route = createFileRoute("/vpn")({
  head: () => ({
    meta: [
      { title: "NullShield — VPN Control Panel" },
      { name: "description", content: "Interactive VPN panel with server selection, tunnel stats, kill switch and a real WebRTC leak test." },
      { property: "og:title", content: "NullShield — VPN Control Panel" },
      { property: "og:description", content: "Pick a server, connect the tunnel and test for IP leaks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vpn,
});

const servers = [
  { id: "se", name: "Stockholm", flag: "🇸🇪", ip: "185.65.134.", ping: 8, load: 34 },
  { id: "de", name: "Frankfurt", flag: "🇩🇪", ip: "193.27.14.", ping: 24, load: 61 },
  { id: "gb", name: "London", flag: "🇬🇧", ip: "141.98.252.", ping: 31, load: 48 },
  { id: "us", name: "New York", flag: "🇺🇸", ip: "198.54.117.", ping: 92, load: 72 },
  { id: "jp", name: "Tokyo", flag: "🇯🇵", ip: "45.14.71.", ping: 241, load: 27 },
];

const handshake = [
  "Resolving endpoint…",
  "Generating Curve25519 keypair…",
  "Sending handshake initiation…",
  "Handshake response received",
  "Deriving ChaCha20-Poly1305 session keys…",
  "Tunnel interface wg0 up",
];

type State = "off" | "connecting" | "on";

function fmt(b: number) {
  if (b < 1024) return `${b.toFixed(0)} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

function Vpn() {
  const ipFn = useServerFn(getIpInfo);
  const [realIp, setRealIp] = useState<string>("…");
  const [sel, setSel] = useState(servers[0]);
  const [state, setState] = useState<State>("off");
  const [log, setLog] = useState<string[]>([]);
  const [vip, setVip] = useState("");
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [hist, setHist] = useState<number[]>([]);
  const [secs, setSecs] = useState(0);
  const [kill, setKill] = useState(true);
  const [leak, setLeak] = useState<null | { ips: string[]; done: boolean }>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    ipFn().then((r) => setRealIp(r.ip || "unknown")).catch(() => setRealIp("unknown"));
  }, [ipFn]);

  useEffect(() => {
    if (state !== "on") return;
    const t = window.setInterval(() => {
      const d = Math.random() * 180000;
      setDown((x) => x + d);
      setUp((x) => x + Math.random() * 40000);
      setSecs((s) => s + 1);
      setHist((h) => [...h.slice(-39), d]);
    }, 1000);
    return () => window.clearInterval(t);
  }, [state]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function connect() {
    if (state !== "off") {
      timers.current.forEach(clearTimeout);
      setState("off");
      setLog((l) => [...l, "Tunnel closed"]);
      return;
    }
    setState("connecting");
    setLog([`Connecting to ${sel.name}…`]);
    setUp(0); setDown(0); setSecs(0); setHist([]);
    handshake.forEach((m, i) => {
      timers.current.push(window.setTimeout(() => {
        setLog((l) => [...l, m]);
        if (i === handshake.length - 1) {
          setVip(sel.ip + (10 + Math.floor(Math.random() * 240)));
          setState("on");
        }
      }, 450 * (i + 1)));
    });
  }

  async function leakTest() {
    setLeak({ ips: [], done: false });
    const found = new Set<string>();
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.createDataChannel("x");
      pc.onicecandidate = (e) => {
        const m = e.candidate?.candidate.match(/(\d{1,3}(\.\d{1,3}){3}|[a-f0-9:]{6,}|[\w-]+\.local)/i);
        if (m) { found.add(m[1]); setLeak({ ips: [...found], done: false }); }
      };
      await pc.setLocalDescription(await pc.createOffer());
      setTimeout(() => { pc.close(); setLeak({ ips: [...found], done: true }); }, 3000);
    } catch {
      setLeak({ ips: [], done: true });
    }
  }

  const on = state === "on";
  const max = Math.max(1, ...hist);
  const leaked = leak?.done && leak.ips.some((i) => i === realIp);

  return (
    <Shell title="VPN control panel" lead="Pick a server, connect the tunnel and run a leak test.">
      <p className="mb-4 rounded border border-border bg-muted p-3 text-xs text-muted-foreground">
        Note: the tunnel on this page is a simulation — browsers don't allow websites to route your traffic. Your real IP and the WebRTC leak test are real. For full protection, use WireGuard (guide below).
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <section className={`${panel} md:col-span-1`}>
          <h2 className="mb-3 font-bold text-primary">Servers</h2>
          <ul className="space-y-2">
            {servers.map((s) => (
              <li key={s.id}>
                <button
                  disabled={state !== "off"}
                  onClick={() => setSel(s)}
                  className={`flex w-full items-center justify-between rounded border p-2 text-left text-sm disabled:opacity-60 ${sel.id === s.id ? "border-primary bg-muted" : "border-border"}`}
                >
                  <span>{s.flag} {s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.ping} ms · {s.load}%</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${panel} md:col-span-2`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${on ? "text-primary" : "text-muted-foreground"}`}>
                {on ? "● PROTECTED" : state === "connecting" ? "◌ CONNECTING" : "○ DISCONNECTED"}
              </div>
              <div className="text-xs text-muted-foreground">WireGuard · ChaCha20-Poly1305 · {sel.flag} {sel.name}</div>
            </div>
            <button className={btn} onClick={connect}>{state === "off" ? "Connect" : "Disconnect"}</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded border border-border p-2"><div className="text-xs text-muted-foreground">Your real IP</div>{realIp}</div>
            <div className="rounded border border-border p-2"><div className="text-xs text-muted-foreground">Tunnel IP</div>{on ? vip : "—"}</div>
            <div className="rounded border border-border p-2"><div className="text-xs text-muted-foreground">↓ Download</div>{fmt(down)}</div>
            <div className="rounded border border-border p-2"><div className="text-xs text-muted-foreground">↑ Upload</div>{fmt(up)}</div>
          </div>

          <div className="mt-3 flex h-16 items-end gap-0.5 rounded border border-border p-1">
            {hist.map((v, i) => <div key={i} className="flex-1 bg-primary" style={{ height: `${(v / max) * 100}%` }} />)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Session: {Math.floor(secs / 60)}m {secs % 60}s</div>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={kill} onChange={(e) => setKill(e.target.checked)} /> Kill switch {kill ? "armed" : "off"}
          </label>

          <pre className="mt-3 max-h-36 overflow-auto rounded bg-muted p-2 text-xs">{log.join("\n") || "Idle."}</pre>
        </section>
      </div>

      <section className={`${panel} mt-4`}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-primary">WebRTC leak test (real)</h2>
          <button className={btn} onClick={leakTest}>Run test</button>
        </div>
        {leak && (
          <div className="mt-2 text-sm">
            <p>{leak.done ? `Found ${leak.ips.length} address(es):` : "Testing…"}</p>
            <ul className="text-xs text-muted-foreground">{leak.ips.map((i) => <li key={i}>{i}{i === realIp ? "  ← your real IP" : ""}</li>)}</ul>
            {leak.done && <p className="mt-1 font-bold">{leaked ? "⚠ Your real IP is visible via WebRTC." : "✓ No real-IP leak detected."}</p>}
          </div>
        )}
      </section>

      <section className={`${panel} mt-4 text-sm text-muted-foreground`}>
        <h2 className="mb-2 font-bold text-primary">Get real protection</h2>
        Install WireGuard (wireguard.com/install), import a .conf from your VPN provider (Mullvad, Proton, IVPN) and activate it. Then <Link to="/" className="text-primary underline">check your IP</Link> — it should change.
      </section>
    </Shell>
  );
}
