import add from 'date-fns/add';
import differenceInMilliseconds from 'date-fns/differenceInMilliseconds';
import isAfter from 'date-fns/isAfter';

export class Token {
  public constructor(
    public readonly token: string,
    public readonly expiresIn: number,
    public readonly expiresAt: Date
  ) {}

  public static create(token: string, expiresIn: number): Token {
    const expiresAt = add(new Date(), { seconds: expiresIn });
    return new Token(token, expiresIn, expiresAt);
  }

  public hasExpired(): boolean {
    return isAfter(new Date(), this.expiresAt);
  }

  public remainingTimeInMs(): number {
    const bufferInMs = 1000 * 30; // 30 seconds
    const ms = differenceInMilliseconds(this.expiresAt, new Date());
    return Math.max(0, ms - bufferInMs);
  }
}
