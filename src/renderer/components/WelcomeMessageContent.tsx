import React from "react";

import { API_PROVIDER_LABELS } from "../../sharedState";
import { useBubbleView } from "../contexts/BubbleViewContext";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";

export const WelcomeMessageContent: React.FC = () => {
  const { setCurrentView } = useBubbleView();
  const { settings } = useSharedState();
  const t = useTranslation();
  const providerLabel = API_PROVIDER_LABELS[settings.apiProvider || "gemini"];
  const hasApiKey = !!(settings.apiKey || settings.geminiApiKey || "").trim();

  return (
    <div className="welcome-content">
      <h3 style={{ margin: "0 0 10px 0", color: "#38bdf8" }}>
        {t.welcome_to_clippy}
      </h3>
      <p>{t.welcome_description}</p>

      <div
        style={{
          padding: "10px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "4px",
          borderLeft: "3px solid #38bdf8",
          margin: "15px 0",
        }}
      >
        <p style={{ margin: 0, fontSize: "13px" }}>
          {hasApiKey
            ? t.api_ready_message.replace("{provider}", providerLabel)
            : t.api_not_configured_message}
        </p>
      </div>

      <p style={{ fontSize: "12px", opacity: 0.8 }}>{t.click_clippy_head_tip}</p>

      <button
        type="button"
        className="win7-button"
        style={{ marginTop: "10px", width: "100%" }}
        onClick={() => setCurrentView("settings-model")}
      >
        {hasApiKey ? t.check_ai_settings : t.configure_ai_provider}
      </button>
    </div>
  );
};
