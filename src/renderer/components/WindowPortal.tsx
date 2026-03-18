import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

import { getThemeCssVariables } from "../../sharedState";
import { clippyApi } from "../clippyApi";
import { WindowContext } from "../contexts/WindowContext";
import { useChat } from "../contexts/ChatContext";
import { useSharedState } from "../contexts/SharedStateContext";

interface WindowPortalProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  title?: string;
}

// Singleton variables - moved outside component to persist across renders
let _externalWindow: Window | null = null;
let containerDiv: HTMLDivElement | null = null;
let isInitialized = false;

export function WindowPortal({
  children,
  width = 400,
  height = 700,
  title = "Clippy Chat",
}: WindowPortalProps) {
  const [externalWindow, setExternalWindow] = useState<Window | null>(null);
  const { isChatWindowOpen, setIsChatWindowOpen } = useChat();
  const { settings } = useSharedState();
  const lastVisibilityRef = useRef<boolean | null>(null);

  const applyThemeToContainer = () => {
    if (!containerDiv) {
      return;
    }

    containerDiv.setAttribute("data-theme", settings.themePreset || "classic");
    const themeStyles = getThemeCssVariables(
      settings.themePreset,
      settings.customTheme,
    );
    Object.entries(themeStyles).forEach(([key, value]) => {
      containerDiv?.style.setProperty(key, value);
    });
  };

  useEffect(() => {
    if (
      (settings.alwaysOpenChat || !settings.hasCompletedOnboarding) &&
      !_externalWindow
    ) {
      setIsChatWindowOpen(true);
    }
  }, [settings.alwaysOpenChat, settings.hasCompletedOnboarding]);

  useEffect(() => {
    if (!containerDiv) {
      return;
    }

    applyThemeToContainer();
  }, [settings.themePreset, settings.customTheme]);

  useEffect(() => {
    if (!isInitialized) {
      containerDiv = document.createElement("div");
      containerDiv.className = "clippy";
      applyThemeToContainer();
      isInitialized = true;
    }

    const showWindow = async () => {
      if (!_externalWindow || _externalWindow.closed) {
        const windowFeatures = `width=${width},height=${height},positionNextToParent`;
        _externalWindow = window.open("", "", windowFeatures);

        if (!_externalWindow) {
          console.error("Failed to open window - popup may be blocked");
          return;
        }

        setExternalWindow(_externalWindow);

        // Setup window
        const externalDoc = _externalWindow.document;
        externalDoc.title = title;

        // Add styles
        const style = externalDoc.createElement("style");
        style.textContent = ``;

        // Copy styles from parent window
        const parentStyles = Array.from(document.styleSheets);
        for (const sheet of parentStyles) {
          try {
            if (sheet.href) {
              // For external stylesheets
              const linkElem = externalDoc.createElement("link");
              linkElem.rel = "stylesheet";
              linkElem.href = sheet.href;
              externalDoc.head.appendChild(linkElem);
            } else {
              // For internal stylesheets
              const rules = Array.from(sheet.cssRules || []);
              for (const rule of rules) {
                style.textContent += rule.cssText + "\n";
              }
            }
          } catch (e) {
            console.warn("Could not copy stylesheet", e);
          }
        }

        externalDoc.head.appendChild(style);

        // Setup close event
        _externalWindow.addEventListener("beforeunload", () => {
          console.log("Window closed by user");
          setIsChatWindowOpen(false);
        });

        // Force transparency on the new window
        externalDoc.documentElement.style.background = "transparent";
        externalDoc.body.style.background = "transparent";
        externalDoc.body.style.margin = "0";
        externalDoc.body.style.padding = "0";
        externalDoc.body.style.overflow = "hidden";

        externalDoc.body.innerHTML = "";
        externalDoc.body.appendChild(containerDiv);
      } else {
        await clippyApi.toggleChatWindow();
      }

      _externalWindow.focus();
    };

    const hideWindow = async () => {
      if (_externalWindow && !_externalWindow.closed) {
        await clippyApi.toggleChatWindow();
      }
    };

    const lastVisibility = lastVisibilityRef.current;
    const hasVisibilityChanged = lastVisibility !== isChatWindowOpen;

    if (!hasVisibilityChanged) {
      return;
    }

    lastVisibilityRef.current = isChatWindowOpen;

    if (isChatWindowOpen) {
      showWindow();
    } else {
      hideWindow();
    }

    return () => {
      // Keep the singleton child window alive across re-renders.
    };
  }, [isChatWindowOpen, width, height, title]);

  if (!containerDiv) {
    return null;
  }

  const wrappedChildren = (
    <WindowContext.Provider value={{ currentWindow: externalWindow || window }}>
      {children}
    </WindowContext.Provider>
  );

  return ReactDOM.createPortal(wrappedChildren, containerDiv);
}
