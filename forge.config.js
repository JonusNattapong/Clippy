const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const { MakerSquirrel } = require("@electron-forge/maker-squirrel");
const { MakerZIP } = require("@electron-forge/maker-zip");
const { MakerDeb } = require("@electron-forge/maker-deb");
const { MakerRpm } = require("@electron-forge/maker-rpm");
const { VitePlugin } = require("@electron-forge/plugin-vite");
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

dotenv.config();

const config = {
  packagerConfig: {
    asar: true,
    executableName: "clippy",
    appBundleId: "com.felixrieseberg.clippy",
    appCategoryType: "public.app-category.productivity",
    win32metadata: {
      CompanyName: "Felix Rieseberg",
      OriginalFilename: "Clippy",
    },
    icon: path.resolve(__dirname, "assets/icon"),
    junk: true,
    overwrite: true,
    prune: true,
  },
  makers: [
    new MakerSquirrel(
      (arch) => {
        const packageJson = JSON.parse(
          fs.readFileSync(path.resolve(__dirname, "./package.json"), "utf8"),
        );
        return {
          name: "Clippy",
          authors: "Felix Rieseberg",
          exe: "Clippy.exe",
          setupExe: `Clippy-${packageJson.version}-setup-${arch}.exe`,
          setupIcon: path.resolve(__dirname, "assets", "icon.ico"),
        };
      },
      ["win32"],
    ),
    new MakerZIP({}, ["darwin", "win32"]),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: "src/main/main.ts",
          config: "vite.main.config.ts",
          target: "main",
        },
        {
          entry: "src/renderer/preload.ts",
          config: "vite.preload.config.ts",
          target: "preload",
        },
      ],
      renderer: [{ name: "main_window", config: "vite.renderer.config.ts" }],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: true,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

module.exports = config;
