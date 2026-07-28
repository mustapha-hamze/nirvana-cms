import { randomInt } from "crypto";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomDigits(length: number): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(randomInt(min, max + 1));
}

function randomUppercase(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += UPPERCASE[randomInt(0, UPPERCASE.length)];
  }
  return result;
}

// e.g. NIRVANA-CMS-APP-2026-48213075-QZTM-9182
export function generateAppKey(): string {
  const year = new Date().getFullYear();
  return `NIRVANA-CMS-APP-${year}-${randomDigits(8)}-${randomUppercase(4)}-${randomDigits(4)}`;
}
