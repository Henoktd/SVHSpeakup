import { createHash, randomInt } from "node:crypto";

const secretWords = [
  "RIVER",
  "GLASS",
  "CEDAR",
  "EMBER",
  "HORIZON",
  "SILVER",
  "OCEAN",
  "CLOUD",
  "ECHO",
  "VALLEY"
];

export function sanitizeText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

export function generateCaseId() {
  const year = new Date().getUTCFullYear();
  const serial = `${Date.now()}`.slice(-9);

  return `SVH-${year}-${serial}`;
}

export function generateReporterSecret() {
  const first = secretWords[randomInt(0, secretWords.length)];
  const second = secretWords[randomInt(0, secretWords.length)];
  const suffix = randomInt(1000, 9999);

  return `${first}-${second}-${suffix}`;
}

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}
