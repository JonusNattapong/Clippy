// Copies "external" modules into the packaged app's node_modules.
//
// The Vite main config marks native modules (and a few pure-JS ones) as
// `external`, so they are NOT bundled into main.js — they stay as
// `require("...")` calls resolved at runtime from node_modules. Electron
// Forge's Vite plugin does not copy those modules into the package, so the
// packaged app.asar ends up with no node_modules and the app crashes on
// launch with "Cannot find module '<name>'".
//
// This module, run from forge.config.js `packageAfterCopy`, copies each
// external module together with its (transitive) production and optional
// dependencies from the project's node_modules into the packaged app's
// node_modules. Native modules like onnxruntime-node, sharp (+ @img/*) and
// node-llama-cpp cannot be bundled, so shipping the real files is the only
// correct option.

const fs = require("node:fs");
const path = require("node:path");

// Top-level modules that must ship as real files. Keep this in sync with the
// `external` array in vite.main.config.ts (excluding anything that is bundled).
const EXTERNAL_MODULES = [
  "@electron/llm",
  "node-llama-cpp",
  "electron-log",
  "onnxruntime-node",
  "sharp",
  "@huggingface/transformers",
];

function readPackageJson(moduleDir) {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(moduleDir, "package.json"), "utf8"),
    );
  } catch {
    return null;
  }
}

// Filter optionalDependencies to only include platform/arch-specific packages
// relevant to the current platform. This prevents copying Windows/macOS binaries
// when building on Linux (or vice versa), which causes issues with the strip tool.
function filterPlatformDeps(optionalDeps) {
  const platform = process.platform; // 'linux', 'darwin', 'win32'
  const arch = process.arch; // 'x64', 'arm64', etc.

  const filtered = {};
  for (const [name, version] of Object.entries(optionalDeps)) {
    // Keep non-platform-specific deps
    if (!name.includes("-")) {
      filtered[name] = version;
      continue;
    }

    // Keep platform-specific deps that match current platform
    // e.g., @img/sharp-linux-x64, onnxruntime-win32-x64, etc.
    if (name.includes(`-${platform}`) || name.includes(`-${platform}-${arch}`)) {
      filtered[name] = version;
    }
  }
  return filtered;
}

// Resolve every module that needs copying: the seed list plus the transitive
// closure of their `dependencies` and `optionalDependencies` (sharp pulls its
// platform binaries in via optionalDependencies, e.g. @img/sharp-win32-x64).
function collectModules(sourceModulesDir, seeds) {
  const resolved = new Set();
  const queue = [...seeds];

  while (queue.length > 0) {
    const name = queue.shift();
    if (resolved.has(name)) continue;

    const moduleDir = path.join(sourceModulesDir, ...name.split("/"));
    if (!fs.existsSync(moduleDir)) {
      // Optional dep for another platform/arch — expected to be absent.
      continue;
    }

    resolved.add(name);

    const pkg = readPackageJson(moduleDir);
    if (!pkg) continue;

    for (const dep of Object.keys(pkg.dependencies || {})) queue.push(dep);
    for (const dep of Object.keys(filterPlatformDeps(pkg.optionalDependencies || {})))
      queue.push(dep);
  }

  return resolved;
}

function copyExternalModules(sourceModulesDir, destModulesDir) {
  const modules = collectModules(sourceModulesDir, EXTERNAL_MODULES);
  let copied = 0;

  for (const name of modules) {
    const from = path.join(sourceModulesDir, ...name.split("/"));
    const to = path.join(destModulesDir, ...name.split("/"));
    if (fs.existsSync(to)) continue;

    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(from, to, { recursive: true, dereference: true });
    copied += 1;
  }

  return { total: modules.size, copied };
}

module.exports = { copyExternalModules, EXTERNAL_MODULES };
