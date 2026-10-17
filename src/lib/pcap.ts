export type Packet = {
  index: number;
  time: string;
  source: string;
  destination: string;
  protocol: string;
  length: number;
  info: string;
};

const ipStr = (v: DataView, o: number) => `${v.getUint8(o)}.${v.getUint8(o + 1)}.${v.getUint8(o + 2)}.${v.getUint8(o + 3)}`;

function hex(v: DataView, o: number, n: number) {
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(v.getUint8(o + i).toString(16).padStart(2, "0"));
  return parts.join(":");
}

function decode(view: DataView, start: number, caplen: number, linkType: number) {
  let off = start;
  let etherType: number | null = null;
  let source = "-";
  let destination = "-";

  if (linkType === 1) {
    if (caplen < 14) return { source, destination, protocol: "Ethernet", info: "truncated frame" };
    destination = hex(view, off, 6);
    source = hex(view, off + 6, 6);
    etherType = view.getUint16(off + 12);
    off += 14;
    while (etherType === 0x8100 && off + 4 <= start + caplen) {
      etherType = view.getUint16(off + 2);
      off += 4;
    }
  } else if (linkType === 101 || linkType === 12 || linkType === 228) {
    etherType = 0x0800;
  } else if (linkType === 113) {
    if (caplen < 16) return { source, destination, protocol: "Linux SLL", info: "truncated" };
    etherType = view.getUint16(off + 14);
    off += 16;
  } else {
    return { source, destination, protocol: `Link type ${linkType}`, info: "unsupported link layer" };
  }

  if (etherType === 0x0806) return { source, destination, protocol: "ARP", info: "Address resolution" };
  if (etherType === 0x86dd) return { source, destination, protocol: "IPv6", info: "IPv6 packet" };
  if (etherType !== 0x0800) return { source, destination, protocol: `0x${(etherType ?? 0).toString(16)}`, info: "non-IPv4" };

  if (off + 20 > start + caplen) return { source, destination, protocol: "IPv4", info: "truncated header" };
  const ihl = (view.getUint8(off) & 0x0f) * 4;
  const proto = view.getUint8(off + 9);
  const src = ipStr(view, off + 12);
  const dst = ipStr(view, off + 16);
  const payload = off + ihl;

  const port = (o: number) => (payload + o + 2 <= start + caplen ? view.getUint16(payload + o) : 0);
  const named = (p: number) =>
    ({ 20: "ftp-data", 21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "dns", 80: "http", 110: "pop3", 143: "imap", 443: "https", 3306: "mysql", 5432: "postgres", 8080: "http-alt" })[p];

  if (proto === 6) {
    const sp = port(0);
    const dp = port(2);
    const app = named(sp) ?? named(dp);
    const flagsByte = payload + 13 < start + caplen ? view.getUint8(payload + 13) : 0;
    const flags = [[0x02, "SYN"], [0x10, "ACK"], [0x01, "FIN"], [0x04, "RST"], [0x08, "PSH"]]
      .filter(([m]) => flagsByte & (m as number)).map(([, n]) => n).join(",");
    return { source: src, destination: dst, protocol: app === "https" ? "TLS" : app === "http" ? "HTTP" : "TCP", info: `${sp} → ${dp}${flags ? ` [${flags}]` : ""}` };
  }
  if (proto === 17) {
    const sp = port(0);
    const dp = port(2);
    const dns = sp === 53 || dp === 53;
    return { source: src, destination: dst, protocol: dns ? "DNS" : "UDP", info: `${sp} → ${dp}` };
  }
  if (proto === 1) return { source: src, destination: dst, protocol: "ICMP", info: "Echo / control message" };
  return { source: src, destination: dst, protocol: `IPv4 proto ${proto}`, info: "" };
}

/** Parses a classic libpcap (.pcap) file. Throws a readable message otherwise. */
export function parsePcap(buffer: ArrayBuffer, limit = 500): { packets: Packet[]; total: number } {
  const view = new DataView(buffer);
  if (buffer.byteLength < 24) throw new Error("File is too small to be a capture file.");
  const magic = view.getUint32(0, false);
  let little: boolean;
  let nano = false;
  if (magic === 0xd4c3b2a1) little = true;
  else if (magic === 0xa1b2c3d4) little = false;
  else if (magic === 0x4d3cb2a1) { little = true; nano = true; }
  else if (magic === 0xa1b23c4d) { little = false; nano = true; }
  else if (magic === 0x0a0d0d0a)
    throw new Error("This is a .pcapng file. In Wireshark use File → Save As and choose 'Wireshark/tcpdump – pcap'.");
  else throw new Error("Not a recognised capture file (.pcap expected).");

  const linkType = view.getUint32(20, little);
  const packets: Packet[] = [];
  let off = 24;
  let total = 0;
  let first: number | null = null;

  while (off + 16 <= buffer.byteLength) {
    const ts = view.getUint32(off, little);
    const sub = view.getUint32(off + 4, little);
    const caplen = view.getUint32(off + 8, little);
    const origlen = view.getUint32(off + 12, little);
    off += 16;
    if (caplen > buffer.byteLength - off) break;
    total += 1;
    if (packets.length < limit) {
      const abs = ts + sub / (nano ? 1e9 : 1e6);
      if (first === null) first = abs;
      const d = decode(view, off, caplen, linkType);
      packets.push({
        index: total,
        time: (abs - first).toFixed(6),
        source: d.source,
        destination: d.destination,
        protocol: d.protocol,
        length: origlen,
        info: d.info,
      });
    }
    off += caplen;
  }
  if (total === 0) throw new Error("No packets found in this file.");
  return { packets, total };
}
