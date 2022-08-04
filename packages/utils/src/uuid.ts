import Long from 'long';
import { parse, v4 as uuid } from 'uuid';

export type UUID = string;

export interface UUIDMsbLsb {
  msb: string;
  lsb: string;
}

export function create(): UUID {
  return uuid();
}

export function fromMsbLsb(msb: bigint | string, lsb: bigint | string): UUID {
  function digits(val: bigint, ds: bigint): string {
    const hi = BigInt(1) << (ds * BigInt(4));
    return (hi | (val & (hi - BigInt(1)))).toString(16).substring(1);
  }

  const msbB = typeof msb === 'string' ? BigInt(msb) : msb;
  const lsbB = typeof lsb === 'string' ? BigInt(lsb) : lsb;

  const sec1 = digits(msbB >> BigInt(32), BigInt(8));
  const sec2 = digits(msbB >> BigInt(16), BigInt(4));
  const sec3 = digits(msbB, BigInt(4));
  const sec4 = digits(lsbB >> BigInt(48), BigInt(4));
  const sec5 = digits(lsbB, BigInt(12));

  return `${sec1}-${sec2}-${sec3}-${sec4}-${sec5}`;
}

export function toMsbLsb(id: UUID): UUIDMsbLsb {
  const bytes = parse(id);

  // I don't know why, but BigInt bitwise ops are produce incorrect values, so
  // using Long.
  let msb = Long.fromInt(0);
  let lsb = Long.fromInt(0);
  for (let i = 0; i < 8; i++) {
    msb = msb.shiftLeft(8).or(bytes[i] & 0xff);
  }
  for (let i = 8; i < 16; i++) {
    lsb = lsb.shiftLeft(8).or(bytes[i] & 0xff);
  }

  return { msb: msb.toString(), lsb: lsb.toString() };
}
