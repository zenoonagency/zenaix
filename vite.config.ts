import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const crossOriginIsolationMiddleware = () => ({
  name: "cross-origin-isolation",
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
      next();
    });
  },
});

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [react(), crossOriginIsolationMiddleware()],
    server: isProduction
      ? {}
      : {
          port: 3000,
          host: true,
          strictPort: true,
          cors: true,
          hmr: {
            host: "localhost",
            protocol: "ws",
            timeout: 30000,
          },
          watch: {
            usePolling: true,
          },
          open: true,
          proxy: {
            "/webhook": {
              target: "https://fluxos-n8n.mgmxhs.easypanel.host",
              changeOrigin: true,
              secure: false,
            },
            "/api": {
              target: "https://codigo-zenaix-backend.w9rr1k.easypanel.host/",
              changeOrigin: true,
              secure: false,
              rewrite: (path) => path,
              cookieDomainRewrite: {
                "codigo-zenaix-backend.w9rr1k.easypanel.host": "localhost",
              },
              configure: (proxy, _options) => {
                proxy.on("error", (err, _req, _res) => {
                  console.error("Proxy error:", err);
                });
              },
            },
            "/storage": {
              target: "https://samiqqeumkhpfgwdkjvb.supabase.co",
              changeOrigin: true,
              secure: false,
            },
          },
        },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      minify: true,
      chunkSizeWarningLimit: 1500,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
    esbuild: {
      logOverride: { "this-is-undefined-in-esm": "silent" },
    },
    define: {
      __DEV__: !isProduction,
    },
  };
});
