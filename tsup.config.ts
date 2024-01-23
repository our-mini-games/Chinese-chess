import type { Options } from 'tsup'

export const tsup: Options = {
  entry: [
    'src/index.ts',
    'src/client.ts',
    'src/server.ts'
  ],
  // publicDir: 'src/assets',
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  clean: true,
  shims: false
}
