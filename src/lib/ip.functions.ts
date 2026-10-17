import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

export const getIpInfo = createServerFn({ method: "GET" }).handler(async () => {
  const fwd = getRequestHeader("x-forwarded-for") ?? "";
  const ip = (getRequestHeader("cf-connecting-ip") ?? fwd.split(",")[0] ?? "").trim();
  const base: { ip: string; city?: string; region?: string; country?: string; org?: string; error?: string } = { ip };
  if (!ip) return { ...base, error: "Could not determine your IP address." };
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (!res.ok) return base;
    const j = (await res.json()) as Record<string, string>;
    return {
      ip,
      city: j["city"],
      region: j["region"],
      country: j["country_name"],
      org: j["org"],
    };
  } catch {
    return base;
  }
});
