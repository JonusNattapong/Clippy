import "./css/App.css";
import "../../../node_modules/98.css/dist/98.css";
import "./css/98.extended.css";
import "./css/Theme.css";
import "./css/Premium.css";

import { Clippy } from "./Clippy";
import { ChatProvider } from "../contexts/ChatContext";
import { WindowPortal } from "./WindowPortal";
import { Bubble } from "./BubbleWindow";
import {
  SharedStateProvider,
  useSharedState,
} from "../contexts/SharedStateContext";
import { BubbleViewProvider } from "../contexts/BubbleViewContext";
import { DebugProvider } from "../contexts/DebugContext";
import { getThemeCssVariables } from "../../sharedState";

export function App() {
  return (
    <DebugProvider>
      <SharedStateProvider>
        <ChatProvider>
          <BubbleViewProvider>
            <AppShell />
          </BubbleViewProvider>
        </ChatProvider>
      </SharedStateProvider>
    </DebugProvider>
  );
}

function AppShell() {
  const { settings } = useSharedState();
  const themeStyles = getThemeCssVariables(
    settings.themePreset,
    settings.customTheme,
  );

  return (
    <div
      className="clippy"
      data-theme={settings.themePreset || "classic"}
      style={{
        ...themeStyles,
        position: "fixed",
        bottom: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        width: "100%",
        height: "100%",
      }}
    >
      <Clippy />
      <WindowPortal width={450} height={650}>
        <Bubble />
      </WindowPortal>
    </div>
  );
}
