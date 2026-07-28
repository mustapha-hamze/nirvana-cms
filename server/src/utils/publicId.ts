import { randomInt } from "crypto";

// Short, random (non-sequential) numeric id safe to expose in public URLs —
// unlike an incrementing counter, guessing one value doesn't reveal the next.
export function generatePublicId(length = 8): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(randomInt(min, max + 1));
}
