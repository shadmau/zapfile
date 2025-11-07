import { ALLOWED_IP_RANGES, ALLOW_ALL_IPS } from "./config.js";

function ipToNumber(ip: string): number {
  const parts = ip.split(".");
  return parts.reduce((acc, part, i) => {
    return acc + parseInt(part) * Math.pow(256, 3 - i);
  }, 0);
}

function isIpInRange(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  return (ipNum & mask) === (rangeNum & mask);
}

export function isIpAllowed(ip: string): boolean {
  if (ALLOW_ALL_IPS) {
    return true;
  }

  // Localhost check (uncomment for development)
  // if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
  //   return true;
  // }

  for (const range of ALLOWED_IP_RANGES) {
    if (isIpInRange(ip, range)) {
      return true;
    }
  }

  return false;
}

export function getClientIp(headers: any, remoteAddress?: string): string {
  const forwarded = headers["x-forwarded-for"];
  if (forwarded) {
    const ips = forwarded.split(",");
    return ips[0].trim();
  }

  const realIp = headers["x-real-ip"];
  if (realIp) {
    return realIp;
  }

  return remoteAddress || "unknown";
}
