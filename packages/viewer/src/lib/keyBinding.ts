export class KeyBinding {
  private bindings: string[];

  public constructor(...bindings: string[]) {
    this.bindings = bindings.map((binding) => binding.toLowerCase());
  }

  public matches(keys: Record<string, boolean>): boolean {
    return this.bindings.every((binding) => this.bindingMatches(keys, binding));
  }

  private bindingMatches(
    keys: Record<string, boolean>,
    binding: string
  ): boolean {
    const negated = binding.includes('!');
    const key = binding.replace('!', '');

    return negated ? !keys[key] : keys[key];
  }
}
