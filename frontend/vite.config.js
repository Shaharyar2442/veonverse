import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// The shared .env lives at the repo root (one file for backend + frontend).
const ENV_DIR = "..";

export default defineConfig(({ mode }) => {
  // Set VITE_PORT in .env to run on a different port (useful when 5173 is
  // already taken by another project). Defaults to Vite's standard 5173.
  const env = loadEnv(mode, ENV_DIR, "");

  return {
    plugins: [react(), tailwindcss()],
    envDir: ENV_DIR,
    server: {
      host: true,
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
    },
  };
});
