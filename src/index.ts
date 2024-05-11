import wasm from "../pkg/wa_ulid_bg.wasm";
import wbgInit, * as waUlid from "../pkg/wa_ulid.js";

export interface PRNG {
  (): number;
}

export interface ULID {
  (seedTime?: number): string;
}

export interface LibError extends Error {
  source: string;
}

function createError(message: string): LibError {
  const err = new Error(message) as LibError;
  err.source = "ulid";
  return err;
}

export function replaceCharAt(str: string, index: number, char: string) {
  return waUlid.replace_char_at(str, index, char);
}

export function incrementBase32(str: string): string {
  try {
    return waUlid.increment_base32(str);
  } catch (e) {
    throw createError((e as Error).message);
  }
}

export function randomChar(prng: PRNG): string {
  return waUlid.random_char(prng());
}

export function encodeTime(now: number, len: number): string {
  try {
    return waUlid.encode_time(now, len);
  } catch (e) {
    throw createError((e as Error).message);
  }
}

export function encodeRandom(len: number, prng: PRNG): string {
  return waUlid.encode_random(len, prng);
}

export function decodeTime(id: string): number {
  try {
    return waUlid.decode_time(id);
  } catch (e) {
    throw createError((e as Error).message);
  }
}

export function detectPrng(_allowInsecure: boolean = false, _root?: Window): PRNG {
  return waUlid.random_value;
}

export function factory(currPrng?: PRNG): ULID {
  return function ulid(seedTime?: number): string {
    if (!seedTime || isNaN(seedTime)) {
      seedTime = Date.now();
    }
    try {
      return waUlid.ulid(seedTime, currPrng);
    } catch (e) {
      throw createError((e as Error).message);
    }
  };
}

export function monotonicFactory(currPrng?: PRNG): ULID {
  const context = new waUlid.MonotonicContext();
  return function ulid(seedTime?: number): string {
    if (!seedTime || isNaN(seedTime)) {
      seedTime = Date.now();
    }
    try {
      return context.ulid(seedTime, currPrng);
    } catch (e) {
      throw createError((e as Error).message);
    }
  };
}

export const ulid = factory();

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const module = wasm();

export default async function init() {
  await wbgInit(module);
}
