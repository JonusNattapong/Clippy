import { BrowserWindow, shell, screen, app } from "electron";
import { getLogger } from "./logger";

import path from "path";
import fs from "fs";
import { getStateManager } from "./state";
import { getDebugManager } from "./debug";
import { popupAppMenu } from "./menu";
import { ThemePreset, WindowBounds, WindowPosition } from "../sharedState";

let mainWindow: BrowserWindow | undefined;
let overlayWindow: BrowserWindow | undefined;
let postItWindow: BrowserWindow | undefined;
const CHAT_WINDOW_TITLES = new Set(["Clippy Chat", "Clippy Chat"]);
const MAIN_WINDOW_SIZE = { width: 125, height: 100 };
const OVERLAY_WINDOW_SIZE = { width: 400, height: 300 };
const POSTIT_WINDOW_SIZE = { width: 250, height: 250 };
const POSTIT_DATA_FILE = "postit.json";

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

export interface PostItData {
  content: string;
  color: string;
  x: number;
  y: number;
}

function getPostItDataPath(): string {
  return path.join(app.getPath("userData"), POSTIT_DATA_FILE);
}

export function loadPostItData(): PostItData | null {
  try {
    const filePath = getPostItDataPath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    getLogger().error("Failed to load post-it data:", error);
  }
  return null;
}

function savePostItData(data: PostItData): void {
  try {
    const filePath = getPostItDataPath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    getLogger().error("Failed to save post-it data:", error);
  }
}

export function getPostItWindow(): BrowserWindow | undefined {
  return postItWindow;
}

export function togglePostItWindow() {
  if (postItWindow && !postItWindow.isDestroyed()) {
    if (postItWindow.isVisible()) {
      postItWindow.hide();
    } else {
      postItWindow.show();
      postItWindow.focus();
    }
  } else {
    createPostItWindow();
  }
}

export function createPostItWindow() {
  if (postItWindow && !postItWindow.isDestroyed()) {
    postItWindow.show();
    postItWindow.focus();
    return;
  }

  const savedData = loadPostItData();
  const settings = getStateManager().store.get("settings");
  const display = screen.getPrimaryDisplay();
  const { x: displayX, y: displayY, width: displayWidth } = display.workArea;

  const defaultX = displayX + displayWidth - POSTIT_WINDOW_SIZE.width - 20;
  const defaultY = displayY + 20;

  postItWindow = new BrowserWindow({
    width: POSTIT_WINDOW_SIZE.width,
    height: POSTIT_WINDOW_SIZE.height,
    x: savedData?.x ?? defaultX,
    y: savedData?.y ?? defaultY,
    minWidth: 150,
    minHeight: 100,
    frame: false,
    transparent: false,
    backgroundColor: savedData?.color || "#ffffa5",
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    title: "Post-it",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Comic Sans MS', 'Marker Felt', sans-serif;
      background-color: ${savedData?.color || "#ffffa5"};
      color: #333;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .title-bar {
      background: linear-gradient(90deg, #808080, #c0c0c0);
      padding: 4px 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      -webkit-app-region: drag;
      user-select: none;
    }
    .title-bar span {
      font-size: 12px;
      font-weight: bold;
    }
    .title-bar button {
      -webkit-app-region: no-drag;
      background: #c0c0c0;
      border: 1px solid #808080;
      width: 16px;
      height: 14px;
      font-size: 10px;
      cursor: pointer;
      padding: 0;
    }
    .title-bar button:hover { background: #fff; }
    .color-buttons {
      display: flex;
      gap: 4px;
      padding: 4px 8px;
      background: rgba(0,0,0,0.05);
    }
    .color-btn {
      width: 20px;
      height: 20px;
      border: 1px solid #808080;
      cursor: pointer;
    }
    .color-btn:hover { transform: scale(1.1); }
    textarea {
      flex: 1;
      width: 100%;
      border: none;
      background: transparent;
      resize: none;
      padding: 8px;
      font-family: inherit;
      font-size: 14px;
      outline: none;
    }
    textarea::placeholder { color: #999; }
  </style>
</head>
<body>
  <div class="title-bar">
    <span>📝 Post-it</span>
    <button id="closeBtn" title="Close">✕</button>
  </div>
  <div class="color-buttons">
    <button class="color-btn" style="background:#ffffa5" data-color="#ffffa5" title="Yellow"></button>
    <button class="color-btn" style="background:#ffb3ba" data-color="#ffb3ba" title="Pink"></button>
    <button class="color-btn" style="background:#baffc9" data-color="#baffc9" title="Green"></button>
    <button class="color-btn" style="background:#bae1ff" data-color="#bae1ff" title="Blue"></button>
    <button class="color-btn" style="background:#ffffba" data-color="#ffffba" title="Light Yellow"></button>
    <button class="color-btn" style="background:#e0bbe4" data-color="#e0bbe4" title="Purple"></button>
  </div>
  <textarea id="note" placeholder="Type your note here...">${savedData?.content || ""}</textarea>
  <script>
    const note = document.getElementById('note');
    const closeBtn = document.getElementById('closeBtn');
    const colorBtns = document.querySelectorAll('.color-btn');
    
    function save() {
      const data = {
        content: note.value,
        color: document.body.style.backgroundColor,
        x: window.innerX,
        y: window.innerY
      };
      window.postMessage({ type: 'save', data }, '*');
    }
    
    note.addEventListener('input', save);
    
    colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.body.style.backgroundColor = btn.dataset.color;
        save();
      });
    });
    
    closeBtn.addEventListener('click', () => {
      window.postMessage({ type: 'close' }, '*');
    });
  </script>
</body>
</html>
  `;

  postItWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
  );

  postItWindow.on("moved", () => {
    if (postItWindow && !postItWindow.isDestroyed()) {
      const [x, y] = postItWindow.getPosition();
      const [width, height] = postItWindow.getSize();
      const data: PostItData = {
        content: (postItWindow as any)._postItContent || "",
        color: postItWindow.getBackgroundColor() || "#ffffa5",
        x,
        y,
      };
      savePostItData(data);
    }
  });

  postItWindow.on("closed", () => {
    postItWindow = undefined;
  });

  postItWindow.webContents.on("did-finish-load", () => {
    postItWindow?.webContents.executeJavaScript(`
      window.addEventListener('message', (event) => {
        if (event.data.type === 'save') {
          const data = event.data.data;
          window.postMessage({ type: 'saveToMain', data: JSON.stringify(data) }, '*');
        } else if (event.data.type === 'close') {
          window.postMessage({ type: 'closeWindow' }, '*');
        }
      });
    `);
  });

  postItWindow.webContents.on("console-message", (_event, level, message) => {
    if (message.startsWith("{") && message.includes('"type":"saveToMain"')) {
      try {
        const data = JSON.parse(message.replace(/^.*\{/, "{"));
        if (data.data) {
          const postItData = JSON.parse(data.data);
          (postItWindow as any)._postItContent = postItData.content;
          savePostItData(postItData);
        }
      } catch {}
    } else if (
      message.startsWith("{") &&
      message.includes('"type":"closeWindow"')
    ) {
      postItWindow?.close();
    }
  });

  getLogger().info("Post-it window created");
}
