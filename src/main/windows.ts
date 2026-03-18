import { BrowserWindow, shell, screen, app } from "electron";
import { getLogger } from "./logger";

import path from "path";
import { getStateManager } from "./state";
import { getDebugManager } from "./debug";
import { popupAppMenu } from "./menu";
import { ThemePreset, WindowBounds, WindowPosition } from "../sharedState";

let mainWindow: BrowserWindow | undefined;
const CHAT_WINDOW_TITLES = new Set(["Clippy Chat", "Clippy Chat"]);
const MAIN_WINDOW_SIZE = { width: 125, height: 100 };

/**
 * Get the main window
 *
 * @returns The main window
 */
export function getMainWindow(): BrowserWindow | undefined {
  return mainWindow;
}

/**
 * Create the main window
 *
 * @returns The main window
 */
export async function createMainWindow() {
  getLogger().info("Creating main window");

  if (mainWindow && !mainWindow.isDestroyed()) {
    getLogger().info("Main window already exists, skipping creation");
    return;
  }

  const settings = getStateManager().store.get("settings");
  const initialPosition = constrainMainWindowPosition(
    settings.clippyPosition,
    MAIN_WINDOW_SIZE,
  );

  mainWindow = new BrowserWindow({
    width: MAIN_WINDOW_SIZE.width,
    height: MAIN_WINDOW_SIZE.height,
    x: initialPosition.x,
    y: initialPosition.y,
    transparent: true,
    hasShadow: false,
    frame: false,
    titleBarStyle: "hidden",
    acceptFirstMouse: true,
    backgroundMaterial: "none",
    resizable: false,
    maximizable: false,
    roundedCorners: false,
    thickFrame: false,
    title: "Clippy",
    alwaysOnTop: settings.clippyAlwaysOnTop,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  mainWindow.webContents.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  );

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on("system-context-menu", (event) => {
    event.preventDefault();
    popupAppMenu();
  });

  mainWindow.webContents.on("context-menu", (event) => {
    event.preventDefault();
    popupAppMenu();
  });

  mainWindow.on("moved", () => {
    persistMainWindowPosition();
  });
}

export function setupWindowListener() {
  app.on(
    "browser-window-created",
    (_event: Electron.Event, browserWindow: BrowserWindow) => {
      const isMainWindow = !browserWindow.getParentWindow();

      getLogger().info(`Creating window (${isMainWindow ? "main" : "child"})`);

      setupWindowOpenHandler(browserWindow);
      setupNavigationHandler(browserWindow);

      if (!isMainWindow) {
        import("electron-context-menu").then((module) => {
          module.default({
            window: browserWindow,
          });
        });
      }

      if (getDebugManager().store.get("openDevToolsOnStart")) {
        browserWindow.webContents.openDevTools({ mode: "detach" });
      }

      if (!isMainWindow) {
        browserWindow.on("moved", () => {
          persistChatWindowBounds(browserWindow);
        });
        browserWindow.on("resized", () => {
          persistChatWindowBounds(browserWindow);
        });
      }

      browserWindow.webContents.on("did-finish-load", () => {
        setFontSize(getStateManager().store.get("settings").defaultFontSize, [
          browserWindow,
        ]);
        setFont(getStateManager().store.get("settings").defaultFont, [
          browserWindow,
        ]);
        setTheme(getStateManager().store.get("settings").themePreset, [
          browserWindow,
        ]);
      });
    },
  );
}

/**
 * Setup the window open handler
 *
 * @param browserWindow The browser window
 */
export function setupWindowOpenHandler(browserWindow: BrowserWindow) {
  browserWindow.webContents.setWindowOpenHandler(({ url, features }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);

      return { action: "deny" };
    }

    getLogger().info(`window.open() called with features: ${features}`);

    const width = parseInt(features.match(/width=(\d+)/)?.[1] || "400", 10);
    const height = parseInt(features.match(/height=(\d+)/)?.[1] || "600", 10);
    const shouldPositionNextToParent = features.includes(
      "positionNextToParent",
    );
    const settings = getStateManager().store.get("settings");
    const savedChatBounds = constrainChatWindowBounds(
      settings.chatWindowBounds,
      {
        width,
        height,
      },
    );
    const newWindowPosition = shouldPositionNextToParent
      ? settings.chatWindowBounds
        ? { x: savedChatBounds.x, y: savedChatBounds.y }
        : getPopoverWindowPosition(browserWindow, {
            width: savedChatBounds.width,
            height: savedChatBounds.height,
          })
      : undefined;

    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        frame: false,
        transparent: true,
        hasShadow: false,
        backgroundColor: "#00000000",
        x: newWindowPosition?.x,
        y: newWindowPosition?.y,
        width: shouldPositionNextToParent ? savedChatBounds.width : width,
        height: shouldPositionNextToParent ? savedChatBounds.height : height,
        roundedCorners: false,
        minHeight: 400,
        minWidth: 400,
        resizable: true,
        maximizable: true,
        alwaysOnTop: settings.chatAlwaysOnTop,
        parent: browserWindow,
        webPreferences: {
          preload: path.join(__dirname, "preload.js"),
        },
      },
    };
  });
}

function setupNavigationHandler(browserWindow: BrowserWindow) {
  browserWindow.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();

    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
  });
}

/**
 * Get the new window position for a popover-like window
 *
 * @param browserWindow The browser window
 * @param size The size of the new window
 * @returns The new window position
 */
export function getPopoverWindowPosition(
  browserWindow: BrowserWindow,
  size: { width: number; height: number },
): { x: number; y: number } {
  const parentBounds = browserWindow.getBounds();
  const { width, height } = size;
  const SPACING = 50; // Distance between windows

  // Get the current display
  const displays = screen.getAllDisplays();
  const display =
    displays.find(
      (display) =>
        parentBounds.x >= display.bounds.x &&
        parentBounds.x <= display.bounds.x + display.bounds.width,
    ) || displays[0];

  // Calculate horizontal position (left or right of parent)
  let x: number;
  const leftPosition = parentBounds.x - width - SPACING;

  // If left position would be off-screen, position to the right
  if (leftPosition < display.bounds.x) {
    x = parentBounds.x + parentBounds.width + SPACING;
  } else {
    x = leftPosition;
  }

  // Try to align the bottom of the new window with the parent window
  let y = parentBounds.y + parentBounds.height - height;

  // Check if the window would be too high (off-screen at the top)
  if (y < display.bounds.y) {
    // Move the window down as much as necessary
    y = display.bounds.y;
  }

  return { x, y };
}

/**
 * Get the chat window
 *
 * @returns The chat window
 */
export function getChatWindow(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find(isChatWindow);
}

/**
 * Check if a window is a chat window
 *
 * @param window The window to check
 * @returns True if the window is a chat window
 */
function isChatWindow(window: BrowserWindow): boolean {
  return CHAT_WINDOW_TITLES.has(window.webContents.getTitle());
}

/**
 * Toggle the chat window
 */
export function toggleChatWindow() {
  const chatWindow = getChatWindow();

  if (!chatWindow) {
    return;
  }

  if (chatWindow.isVisible()) {
    chatWindow.hide();
  } else {
    const mainWindow = getMainWindow();
    const savedBounds =
      getStateManager().store.get("settings").chatWindowBounds;

    if (savedBounds) {
      const nextBounds = constrainChatWindowBounds(savedBounds);
      chatWindow.setBounds(nextBounds);
    } else {
      const [width, height] = chatWindow.getSize();
      const position = getPopoverWindowPosition(mainWindow, { width, height });
      chatWindow.setPosition(position.x, position.y);
    }

    chatWindow.show();
    chatWindow.focus();
  }
}

/**
 * Minimize the chat window
 */
export function minimizeChatWindow() {
  return getChatWindow()?.minimize();
}

/**
 * Maximize the chat window
 */
export function maximizeChatWindow() {
  if (getChatWindow()?.isMaximized()) {
    return getChatWindow()?.unmaximize();
  }

  return getChatWindow()?.maximize();
}

/**
 * Set the font size for all windows
 *
 * @param fontSize The font size to set
 */
export function setFontSize(
  fontSize: number,
  windows: BrowserWindow[] = BrowserWindow.getAllWindows(),
) {
  windows.forEach((window) => {
    window.webContents.executeJavaScript(
      `document.documentElement.style.setProperty('--font-size', '${fontSize}px');`,
    );
  });
}

/**
 * Set the font for all windows
 *
 * @param font The font to set
 */
export function setFont(
  font: string,
  windows: BrowserWindow[] = BrowserWindow.getAllWindows(),
) {
  windows.forEach((window) => {
    window.webContents.executeJavaScript(
      `document.querySelector('.clippy').setAttribute('data-font', '${font}');`,
    );
  });
}

/**
 * Set the theme preset for all windows
 *
 * @param themePreset The theme preset to apply
 */
export function setTheme(
  themePreset: ThemePreset = "classic",
  windows: BrowserWindow[] = BrowserWindow.getAllWindows(),
) {
  windows.forEach((window) => {
    window.webContents.executeJavaScript(
      `document.querySelector('.clippy')?.setAttribute('data-theme', '${themePreset}');`,
    );
  });
}

export function getMainWindowPosition() {
  const window = getMainWindow();
  if (!window) {
    return null;
  }

  const [x, y] = window.getPosition();
  return { x, y };
}

export function setMainWindowPosition(x: number, y: number) {
  const window = getMainWindow();
  if (!window) {
    return;
  }

  const [width, height] = window.getSize();
  const nextPosition = constrainMainWindowPosition({ x, y }, { width, height });
  window.setPosition(nextPosition.x, nextPosition.y);
  persistMainWindowPosition();
}

function persistMainWindowPosition() {
  const position = getMainWindowPosition();
  if (!position) {
    return;
  }

  getStateManager().store.set("settings.clippyPosition", position);
}

function persistChatWindowBounds(window: BrowserWindow) {
  const nextBounds = constrainChatWindowBounds(window.getBounds());
  getStateManager().store.set("settings.chatWindowBounds", nextBounds);
}

function constrainMainWindowPosition(
  position: WindowPosition | undefined,
  size: { width: number; height: number },
): WindowPosition {
  const display = getDisplayForPosition(position) || screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;
  const margin = 12;

  const desiredX = position?.x ?? x + width - size.width - margin;
  const desiredY = position?.y ?? y + height - size.height - margin;

  return {
    x: Math.round(
      Math.min(Math.max(desiredX, x), x + Math.max(width - size.width, 0)),
    ),
    y: Math.round(
      Math.min(Math.max(desiredY, y), y + Math.max(height - size.height, 0)),
    ),
  };
}

function getDisplayForPosition(position?: Partial<WindowPosition>) {
  if (!position) {
    return screen.getPrimaryDisplay();
  }

  if (position.x === undefined || position.y === undefined) {
    return screen.getPrimaryDisplay();
  }

  const displays = screen.getAllDisplays();
  return (
    displays.find((display) => {
      const { x, y, width, height } = display.workArea;
      return (
        position.x >= x &&
        position.x <= x + width &&
        position.y >= y &&
        position.y <= y + height
      );
    }) || screen.getDisplayNearestPoint({ x: position.x, y: position.y })
  );
}

function constrainChatWindowBounds(
  bounds: Partial<WindowBounds> | undefined,
  fallbackSize: { width: number; height: number } = { width: 450, height: 650 },
): WindowBounds {
  const width = Math.max(Math.round(bounds?.width ?? fallbackSize.width), 400);
  const height = Math.max(
    Math.round(bounds?.height ?? fallbackSize.height),
    400,
  );
  const display = getDisplayForPosition(bounds) || screen.getPrimaryDisplay();
  const { x, y, width: workWidth, height: workHeight } = display.workArea;
  const desiredX = bounds?.x ?? x + workWidth - width - 24;
  const desiredY = bounds?.y ?? y + workHeight - height - 24;

  return {
    x: Math.round(
      Math.min(Math.max(desiredX, x), x + Math.max(workWidth - width, 0)),
    ),
    y: Math.round(
      Math.min(Math.max(desiredY, y), y + Math.max(workHeight - height, 0)),
    ),
    width: Math.min(width, workWidth),
    height: Math.min(height, workHeight),
  };
}
