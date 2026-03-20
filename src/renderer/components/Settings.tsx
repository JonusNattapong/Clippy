import { useEffect, useState } from "react";

import { TabList } from "./TabList";
import { BubbleView, useBubbleView } from "../contexts/BubbleViewContext";
import { SettingsModel } from "./SettingsModel";
import { BubbleWindowBottomBar } from "./BubbleWindowBottomBar";
import { SettingsAdvanced } from "./SettingsAdvanced";
import { SettingsAppearance } from "./SettingsAppearance";
import { SettingsAbout } from "./SettingsAbout";
import { SettingsParameters } from "./SettingsParameters";
import { SettingsMemory } from "./SettingsMemory";
import { SettingsIdentity } from "./SettingsIdentity";
import { SettingsUser } from "./SettingsUser";
import { SettingsTTS } from "./SettingsTTS";
import { SettingsPermissions } from "./SettingsPermissions";
import { useTranslation } from "../contexts/SharedStateContext";

export type SettingsTab =
  | "appearance"
  | "model"
  | "parameters"
  | "memory"
  | "identity"
  | "aboutYou"
  | "tts"
  | "permissions"
  | "advanced"
  | "about";

export type SettingsProps = {
  onClose: () => void;
};

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { currentView, setCurrentView } = useBubbleView();
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    bubbleViewToSettingsTab(currentView),
  );

  useEffect(() => {
    const newTab = bubbleViewToSettingsTab(currentView);

    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [currentView, activeTab]);

  const tabs = [
    { label: t.appearance, key: "appearance", content: <SettingsAppearance /> },
    { label: t.ai_provider, key: "model", content: <SettingsModel /> },
    { label: t.prompts, key: "parameters", content: <SettingsParameters /> },
    { label: t.memory, key: "memory", content: <SettingsMemory /> },
    { label: t.identity, key: "identity", content: <SettingsIdentity /> },
    { label: t.about_you, key: "aboutYou", content: <SettingsUser /> },
    { label: "Voice", key: "tts", content: <SettingsTTS /> },
    {
      label: "Permissions",
      key: "permissions",
      content: <SettingsPermissions />,
    },
    { label: t.advanced, key: "advanced", content: <SettingsAdvanced /> },
    { label: t.about, key: "about", content: <SettingsAbout /> },
  ];

  return (
    <>
      <div className="settings-header">
        <div className="settings-header-kicker">{t.clippy_control_panel}</div>
        <h2>{t.settings}</h2>
        <p>{t.settings_description}</p>
      </div>
      <TabList
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setCurrentView(`settings-${tab}` as BubbleView)}
      />
      <BubbleWindowBottomBar>
        <button type="button" onClick={onClose}>
          {t.back_to_chat}
        </button>
      </BubbleWindowBottomBar>
    </>
  );
};

/**
 * Converts a BubbleView to a SettingsTab.
 *
 * @param view - The BubbleView to convert.
 * @returns The SettingsTab.
 */
function bubbleViewToSettingsTab(view: BubbleView): SettingsTab {
  if (!view || !view.includes("settings")) {
    return "appearance";
  }

  const settingsTab = view.replace(/settings-?/, "");
  const settingsTabs = [
    "appearance",
    "model",
    "parameters",
    "memory",
    "identity",
    "aboutYou",
    "tts",
    "permissions",
    "advanced",
    "about",
  ] as const;

  if (settingsTabs.includes(settingsTab as SettingsTab)) {
    return settingsTab as SettingsTab;
  }

  return "appearance";
}
