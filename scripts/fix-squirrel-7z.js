// Workaround for electron-winstaller / Squirrel.Windows on Windows.
//
// When making the Squirrel installer, Squirrel extracts the release .nupkg by
// spawning "7z.exe", but electron-winstaller only ships arch-suffixed binaries
// ("7z-x64.exe" / "7z-arm64.exe"). The missing "7z.exe" makes Squirrel fail
// with: "Failed to extract file ... The system cannot find the file specified".
//
// This script creates "7z.exe"/"7z.dll" aliases from the arch-specific files so
// `npm run make` works. Runs automatically on postinstall; safe to run anywhere
// (no-op when the vendor dir or source files are missing, e.g. non-Windows).

const fs = require("node:fs");
const path = require("node:path");

const vendorDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "electron-winstaller",
  "vendor",
);

if (!fs.existsSync(vendorDir)) {
  // electron-winstaller not installed (e.g. CI without dev deps) — nothing to do.
  return;
}

const arch = process.arch === "arm64" ? "arm64" : "x64";
const aliases = [
  [`7z-${arch}.exe`, "7z.exe"],
  [`7z-${arch}.dll`, "7z.dll"],
];

for (const [source, target] of aliases) {
  const sourcePath = path.join(vendorDir, source);
  const targetPath = path.join(vendorDir, target);

  if (!fs.existsSync(sourcePath) || fs.existsSync(targetPath)) {
    continue;
  }

  fs.copyFileSync(sourcePath, targetPath);
  console.log(`[fix-squirrel-7z] created ${target} from ${source}`);
}
