import { describe, expect, it } from "vitest";
import { parsePcap } from "@/lib/pcap";

function makePcap() {
  const frame = new Uint8Array(14 + 20 + 8);
  const v = new DataView(frame.buffer);
  v.setUint16(12, 0x0800);
  v.setUint8(14, 0x45);
  v.setUint8(23, 17);
  [8, 8, 8, 8].forEach((b, i) => v.setUint8(26 + i, b));
  [1, 1, 1, 1].forEach((b, i) => v.setUint8(30 + i, b));
  v.setUint16(34, 5000);
  v.setUint16(36, 53);
  const buf = new ArrayBuffer(24 + 16 + frame.length);
  const d = new DataView(buf);
  d.setUint32(0, 0xa1b2c3d4, true);
  d.setUint32(20, 1, true);
  d.setUint32(32, frame.length, true);
  d.setUint32(36, frame.length, true);
  new Uint8Array(buf).set(frame, 40);
  return buf;
}

describe("parsePcap", () => {
  it("decodes a DNS packet", () => {
    const r = parsePcap(makePcap());
    expect(r.total).toBe(1);
    expect(r.packets[0]).toMatchObject({ source: "8.8.8.8", destination: "1.1.1.1", protocol: "DNS" });
  });
  it("rejects pcapng with guidance", () => {
    const b = new ArrayBuffer(32);
    new DataView(b).setUint32(0, 0x0a0d0d0a);
    expect(() => parsePcap(b)).toThrow(/pcapng/);
  });
});
