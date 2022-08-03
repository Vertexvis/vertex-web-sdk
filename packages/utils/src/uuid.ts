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

export function toMsbLsb(id: UUID): UUIDMsbLsb {
  const bytes = parse(id);

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
