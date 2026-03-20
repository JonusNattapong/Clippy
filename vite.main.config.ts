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
      external: [
        "@electron/llm",
        "node-llama-cpp",
        "electron-log",
        "electron-store",
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
