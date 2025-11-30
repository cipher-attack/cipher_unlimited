import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
    define: {
      // This allows the code to access process.env.VERCEL_API_KEY even in the browser
      'process.env.VERCEL_API_KEY': JSON.stringify(process.env.VERCEL_API_KEY || env.VERCEL_API_KEY),
      // Fallback for standard API_KEY
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY),
    }
  }
})
