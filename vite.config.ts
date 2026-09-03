import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./package.json", import.meta.url)),
    "utf-8"
  )
) as { version?: string };

const appVersion = pkg.version ?? "0.0.0";

function appEnvFromMode(mode: string): string {
  if (mode === "production") return "prod";
  if (mode === "development") return "dev";
  return mode;
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "movix-version-manifest",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({
            version: appVersion,
            env: appEnvFromMode(mode),
            buildTime: new Date().toISOString(),
          }),
        });
      },
    },
    {
      name: "movix-seo",
      transformIndexHtml(html: string) {
        if (appEnvFromMode(mode) === "prod") return html;
        return {
          html,
          tags: [
            {
              tag: "meta",
              attrs: { name: "robots", content: "noindex, nofollow" },
              injectTo: "head" as const,
            },
          ],
        };
      },
      generateBundle() {
        if (appEnvFromMode(mode) === "prod") {
          this.emitFile({
            type: "asset",
            fileName: "robots.txt",
            source:
              "User-agent: *\nAllow: /\nDisallow: /app/\n\nSitemap: https://movix.fr/sitemap.xml\n",
          });
          this.emitFile({
            type: "asset",
            fileName: "sitemap.xml",
            source:
              '<?xml version="1.0" encoding="UTF-8"?>\n' +
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
              "  <url><loc>https://movix.fr/</loc></url>\n" +
              "  <url><loc>https://movix.fr/download</loc></url>\n" +
              "  <url><loc>https://movix.fr/login</loc></url>\n" +
              "  <url><loc>https://movix.fr/register</loc></url>\n" +
              "</urlset>\n",
          });
        } else {
          this.emitFile({
            type: "asset",
            fileName: "robots.txt",
            source: "User-agent: *\nDisallow: /\n",
          });
        }
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [".movix.fr", ".nip.io", ".sslip.io"],
  },
}));
