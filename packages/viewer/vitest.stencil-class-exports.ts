import type { Plugin } from 'vitest/config';

/** Keep source component class imports available to legacy mock fixtures. */
export function stencilClassExports(): Plugin {
  return {
    name: 'stencil-vitest-class-exports',
    enforce: 'post',
    transform(code, id) {
      if (
        !id.endsWith('.tsx') ||
        !code.includes('__stencil_defineCustomElement')
      )
        return null;
      const match = code.match(
        /(?:const|let) (\w+) = class extends HTMLElement/,
      );
      if (!match || code.includes(`export { ${match[1]} }`)) return null;
      return `${code}\nexport { ${match[1]} };\n`;
    },
  };
}
