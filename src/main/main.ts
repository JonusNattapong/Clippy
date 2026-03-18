import "dotenv/config";
import { shouldQuit } from "./squirrel-startup";
import { getLogger } from "./logger";

if (shouldQuit) {
  app.quit();
}

import { app, BrowserWindow, session } from "electron";
import { setupIpcListeners } from "./ipc";
import { createMainWindow, setupWindowListener } from "./windows";
import { setupAutoUpdater } from "./update";
import { setupAppMenu } from "./menu";
import { getMemoryManager } from "./memory";
import { getStateManager } from "./state";

async function migrateUserMemory() {
  try {
    const stateManager = getStateManager();
    const memoryManager = getMemoryManager();

    // Check if there's old userMemory to migrate
    const userMemory = stateManager.store.get("settings.userMemory") as string;
    if (userMemory && userMemory.trim()) {
      console.info("Migrating userMemory to structured memory system...");
      const migrated = memoryManager.migrateFromUserMemory(userMemory);
      console.info(`Migrated ${migrated} memories from userMemory`);

      // Clear the old userMemory
      stateManager.store.set("settings.userMemory", "");

      // Migrate old stats if they exist
      const oldBond = stateManager.store.get("settings.bondLevel") as number;
      const oldHappy = stateManager.store.get("settings.happiness") as number;
      if (oldBond !== undefined || oldHappy !== undefined) {
        memoryManager.updateStats({
          bondLevel: oldBond ?? 0,
          happiness: oldHappy ?? 50,
        });
      }
    }
  } catch (error) {
    console.error("Error migrating userMemory:", error);
  }
}

function syncRelationshipStateFromMemory() {
  const stateManager = getStateManager();
  const stats = getMemoryManager().getStats();
  stateManager.store.set("settings.bondLevel", stats.bondLevel);
  stateManager.store.set("settings.happiness", stats.happiness);
  stateManager.store.set("settings.clippyMood", stats.mood.primary);
  stateManager.store.set("settings.clippyMoodIntensity", stats.mood.intensity);
  stateManager.store.set(
    "settings.clippySocialBattery",
    stats.mood.socialBattery,
  );
  stateManager.store.set(
    "settings.clippyResponseStyle",
    stats.mood.responseStyle,
  );
  stateManager.store.set("settings.clippyUserTone", stats.mood.userTone);
}

async function onReady() {
  console.info(`Welcome to Clippy v${app.getVersion()}`);

  // Handle permissions
  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => {
      if (
        ["media", "audioCapture", "microphone", "display-capture"].includes(
          permission,
        )
      ) {
        return true;
      }
      return false;
    },
  );

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (
        ["media", "audioCapture", "microphone", "display-capture"].includes(
          permission,
        )
      ) {
        callback(true);
      } else {
        callback(false);
      }
    },
  );

  // Run migration before other setup
  await migrateUserMemory();
  getMemoryManager().runMaintenanceIfDue();
  syncRelationshipStateFromMemory();

  await setupAutoUpdater();
  setupAppMenu();
  setupIpcListeners();
  setupWindowListener();
  await createMainWindow();
}

app.on("ready", onReady);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
