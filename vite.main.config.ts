import { defineConfig } from "vite";
import commonjs from "@rollup/plugin-commonjs";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        format: "cjs",
        inlineDynamicImports: true,
      },
      // Only keep modules with native binaries (or that break when bundled)
      // external — everything else is bundled into main.js so the packaged
      // app.asar doesn't rely on node_modules being present at runtime.
      // electron-store is pure JS, so bundling it avoids the "Cannot find
      // module 'electron-store'" crash when the packager prunes node_modules.
      external: [
        "@electron/llm",
        "node-llama-cpp",
        "electron-log",
        "onnxruntime-node",
        "sharp",
        "@huggingface/transformers",
        /^@img\//,
      ],
      plugins: [
        commonjs({
          ignoreDynamicRequires: true,
          transformMixedEsModules: true,
          esmExternals: true,
        }),
      ],
    },
    sourcemap: true,
    target: "node18",
  },
});
