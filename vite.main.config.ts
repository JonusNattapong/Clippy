import { defineConfig } from "vite";
import commonjs from "@rollup/plugin-commonjs";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["@electron/llm", "node-llama-cpp", "electron-log"],
      plugins: [
        // Ensure Rollup CommonJS plugin knows about dynamic requires for native bindings
        commonjs({
          // Allow dynamic requires so native `.node` binaries referenced at runtime are preserved
          ignoreDynamicRequires: false,
          // Explicitly whitelist likely native binding paths so the plugin does not error
          dynamicRequireTargets: [
            // onnxruntime native binding pattern
            "**/bin/napi-v3/**/onnxruntime_binding.node",
            // any other .node native bindings under node_modules
            "**/*.node",
          ],
        }),
      ],
    },
    sourcemap: true,
  },
});
