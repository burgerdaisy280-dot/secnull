import { createFileRoute } from "@tanstack/react-router";

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[?::1\]?$)/i;

export const Route = createFileRoute("/api/public/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("url") ?? "";
        let target: URL;
        try {
          target = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
        } catch {
          return new Response("Invalid URL", { status: 400 });
        }
        if (!/^https?:$/.test(target.protocol) || PRIVATE.test(target.hostname)) {
          return new Response("Address not allowed", { status: 400 });
        }
        let res: Response;
        try {
          res = await fetch(target.toString(), {
            headers: { "user-agent": "Mozilla/5.0 (NullShield Proxy)", accept: request.headers.get("accept") ?? "*/*" },
            redirect: "follow",
          });
        } catch {
          return new Response("Could not reach the site", { status: 502 });
        }
        const type = res.headers.get("content-type") ?? "application/octet-stream";
        const headers = new Headers({ "content-type": type, "cache-control": "no-store" });
        if (!type.includes("text/html")) return new Response(res.body, { status: res.status, headers });

        const finalUrl = res.url || target.toString();
        const inject = `<base href="${finalUrl.replace(/"/g, "&quot;")}"><script>
(function(){var P="/api/public/proxy?url=";
function wrap(u){try{var a=new URL(u,document.baseURI);if(!/^https?:/.test(a.protocol))return null;return P+encodeURIComponent(a.href)}catch(e){return null}}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var w=wrap(a.getAttribute("href"));if(w){e.preventDefault();location.href=w}},true);
document.addEventListener("submit",function(e){var f=e.target;if((f.method||"get").toLowerCase()!=="get")return;e.preventDefault();var u=new URL(f.action||document.baseURI,document.baseURI);u.search=new URLSearchParams(new FormData(f)).toString();location.href=P+encodeURIComponent(u.href)},true);
})();</script>`;
        let html = await res.text();
        html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + html;
        return new Response(html, { status: res.status, headers });
      },
    },
  },
});
