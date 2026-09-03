import { defineConfig, mergeConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import baseConfig from "./vite.config";

export default defineConfig((env) =>
  mergeConfig(baseConfig(env), { plugins: [basicSsl()] })
);
