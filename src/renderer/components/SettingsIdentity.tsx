import { useCallback, useEffect, useState } from "react";
import { clippyApi } from "../clippyApi";
import { useTranslation } from "../contexts/SharedStateContext";

interface IdentityData {
  name: string;
  vibe: string;
  emoji: string;
  mission: string;
}

export const SettingsIdentity: React.FC = () => {
  const [identity, setIdentity] = useState<IdentityData>({
    name: "Clippy",
    vibe: "Warm, friendly, caring, slightly playful",
    emoji: "📎",
    mission:
      "To be the kind of AI friend that actually remembers what matters to you",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    clippyApi.getIdentity().then((data) => {
      setIdentity(data);
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await clippyApi.setIdentity(identity);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving identity:", error);
    } finally {
      setSaving(false);
    }
  }, [identity]);

  const handleChange = (field: keyof IdentityData, value: string) => {
    setIdentity((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-page-intro">
          <h3>{t.identity}</h3>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.identity}</h3>
        <p>{t.identity_description}</p>
      </div>

      <fieldset>
        <legend>{t.basic_info}</legend>
        <div className="field-row-stacked">
          <label>{t.name}:</label>
          <input
            type="text"
            value={identity.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t.name}
          />
        </div>
        <div className="field-row-stacked">
          <label>{t.emoji}:</label>
          <input
            type="text"
            value={identity.emoji}
            onChange={(e) => handleChange("emoji", e.target.value)}
            placeholder="📎"
            style={{ width: "60px" }}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.personality}</legend>
        <div className="field-row-stacked">
          <label>{t.vibe}:</label>
          <input
            type="text"
            value={identity.vibe}
            onChange={(e) => handleChange("vibe", e.target.value)}
            placeholder={t.vibe}
          />
        </div>
        <div className="field-row-stacked">
          <label>{t.mission}:</label>
          <textarea
            rows={3}
            value={identity.mission}
            onChange={(e) => handleChange("mission", e.target.value)}
            placeholder={t.mission}
            style={{ resize: "vertical" }}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.preview_label}</legend>
        <div
          style={{
            padding: "15px",
            background: "#f5f5f5",
            borderRadius: "8px",
            border: "2px solid #ddd",
          }}
        >
          <div style={{ fontSize: "24px", marginBottom: "10px" }}>
            {identity.emoji} <strong>{identity.name}</strong>
          </div>
          <div style={{ color: "#666", marginBottom: "8px" }}>
            <strong>{t.vibe}:</strong> {identity.vibe}
          </div>
          <div style={{ color: "#666" }}>
            <strong>{t.mission}:</strong> {identity.mission}
          </div>
        </div>
      </fieldset>

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? t.saving : saved ? t.saved : t.save_changes}
        </button>
        {saved && (
          <span style={{ color: "#5cb85c", fontSize: "14px" }}>
            {t.identity_updated}
          </span>
        )}
      </div>
    </div>
  );
};
