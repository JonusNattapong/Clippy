import { defineConfig } from "vite";
import commonjs from "@rollup/plugin-commonjs";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
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
        }),
      ],
    },
    sourcemap: true,
  },
});
