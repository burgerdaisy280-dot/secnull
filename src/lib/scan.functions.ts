import { createServerFn } from "@tanstack/react-start";

const PORTS: [number, string][] = [
  [21, "ftp"], [22, "ssh"], [23, "telnet"], [25, "smtp"], [53, "dns"], [80, "http"],
  [110, "pop3"], [143, "imap"], [443, "https"], [465, "smtps"], [587, "submission"],
  [993, "imaps"], [3306, "mysql"], [3389, "rdp"], [5432, "postgres"], [6379, "redis"],
  [8080, "http-alt"], [8443, "https-alt"],
];

export const scanHost = createServerFn({ method: "POST" })
  .validator((input: { host: string }) => {
    const host = String(input.host ?? "").trim().toLowerCase();
    if (!/^[a-z0-9.-]{1,253}$/.test(host)) throw new Error("Enter a valid hostname or IP");
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host))
      throw new Error("Private addresses can't be scanned");
    return { host };
  })
  .handler(async ({ data }) => {
    const net = await import("node:net");
    const check = (port: number) =>
      new Promise<"open" | "closed/filtered">((resolve) => {
        const s = net.connect({ host: data.host, port });
        const done = (r: "open" | "closed/filtered") => { s.destroy(); resolve(r); };
        s.setTimeout(2500, () => done("closed/filtered"));
        s.once("connect", () => done("open"));
        s.once("error", () => done("closed/filtered"));
      });
    const results = await Promise.all(
      PORTS.map(async ([port, service]) => ({ port, service, state: await check(port) })),
    );
    return { host: data.host, results };
  });
