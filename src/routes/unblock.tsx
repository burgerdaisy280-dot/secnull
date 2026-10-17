import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, panel, btn, field } from "@/components/Shell";

export const Route = createFileRoute("/unblock")({
  head: () => ({
    meta: [
      { title: "NullShield — Web Proxy" },
      { name: "description", content: "Open websites through the NullShield server so local network filters can't see which site you visit." },
      { property: "og:title", content: "NullShield — Web Proxy" },
      { property: "og:description", content: "Browse websites through the NullShield server." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Unblock,
});

function Unblock() {
  const [url, setUrl] = useState("");
  const [src, setSrc] = useState("");

  return (
    <Shell title="Web proxy" lead="Open a website through our server. Your network only sees a connection to NullShield.">
      <form
        className={`${panel} flex gap-2`}
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) setSrc(`/api/public/proxy?url=${encodeURIComponent(url.trim())}`);
        }}
      >
        <input className={field} placeholder="t.ex. wikipedia.org" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button className={btn} type="submit">Öppna</button>
        {src && <a className={btn} href={src} target="_blank" rel="noreferrer">Ny flik</a>}
      </form>
      {src && <iframe title="Proxy" src={src} className="mt-4 h-[70vh] w-full rounded border border-border bg-card" />}
      <p className="mt-3 text-xs text-muted-foreground">
        Fungerar bäst för vanliga sidor (artiklar, wikis). Inloggningar och videotjänster kan sluta fungera. Om själva NullShield blockeras behövs en riktig VPN-app.
      </p>
    </Shell>
  );
}
