import { v4 as uuid } from 'uuid';

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
  const [c1, c2, c3, c4, c5] = id.split('-');

  if (c1 == null || c2 == null || c3 == null || c4 == null || c5 == null) {
    throw new Error(`Invalid UUID string ${id}`);
  }

  const msb = BigInt.asIntN(64, BigInt(`0x${c1 + c2 + c3}`));
  const lsb = BigInt.asIntN(64, BigInt(`0x${c4 + c5}`));

  return { msb: msb.toString(), lsb: lsb.toString() };
}
