declare module '@stencil/vue-output-target/runtime' {
  export type StencilVueComponent<T> = T;

  export function defineContainer<T>(
    tagName: string,
    _component: unknown,
    _properties?: string[],
    _events?: string[]
  ): StencilVueComponent<T>;
}
