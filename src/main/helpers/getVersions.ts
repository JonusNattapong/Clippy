import { app } from "electron";
import { Versions } from "../../types/interfaces";

/**
 * Get the versions of the application
 *
 * @returns {Versions} The versions of the application
 */
export async function getVersions(): Promise<Versions> {
  const versions: Versions = {
    ...process.versions,
    clippy: app.getVersion(),
    chromium: process.versions.chrome,
  };

  return versions;
}
