import { config, input, output, typescript } from '@vertexvis/build-tools';

export default config(input('src/index.ts'), typescript(), output());
