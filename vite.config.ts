import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      dts({
        copyDtsFiles: true
      })
    ],
    build: {
      lib: {
        entry: './src/index.ts',
        name: 'ChineseChessService',
        fileName: 'chinese-chess-service',
        formats: ['es', 'cjs']
      },
      sourcemap: mode !== 'production'
    }
  }
})
