import { useCallback, useEffect, useState } from "react";
import { clippyApi } from "../clippyApi";
import { useTranslation } from "../contexts/SharedStateContext";

interface UserData {
  name: string;
  nickname: string;
  pronouns: string;
  timezone: string;
  language: string;
  communicationStyle: string;
  responseLength: string;
  tone: string;
  topicsToAvoid: string;
  notes: string;
}

export const SettingsUser: React.FC = () => {
  const [user, setUser] = useState<UserData>({
    name: "",
    nickname: "",
    pronouns: "",
    timezone: "",
    language: "Thai / English",
    communicationStyle: "",
    responseLength: "Medium",
    tone: "Casual",
    topicsToAvoid: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    clippyApi.getUser().then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await clippyApi.setUser(user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving user:", error);
    } finally {
      setSaving(false);
    }
  }, [user]);

  const handleChange = (field: keyof UserData, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-page-intro">
          <h3>{t.about_you}</h3>
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.about_you}</h3>
        <p>{t.user_description}</p>
      </div>

      <fieldset>
        <legend>{t.basic_info}</legend>
        <div className="field-row">
          <label>{t.name}:</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder={t.name}
          />
        </div>
        <div className="field-row">
          <label>{t.nickname}:</label>
          <input
            type="text"
            value={user.nickname}
            onChange={(e) => handleChange("nickname", e.target.value)}
            placeholder={t.nickname}
          />
        </div>
        <div className="field-row">
          <label>{t.pronouns}:</label>
          <input
            type="text"
            value={user.pronouns}
            onChange={(e) => handleChange("pronouns", e.target.value)}
            placeholder="he/him, she/her, they/them..."
          />
        </div>
        <div className="field-row">
          <label>{t.timezone}:</label>
          <input
            type="text"
            value={user.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            placeholder="Asia/Bangkok"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.comm_preferences}</legend>
        <div className="field-row-stacked">
          <label>{t.comm_style}:</label>
          <input
            type="text"
            value={user.communicationStyle}
            onChange={(e) => handleChange("communicationStyle", e.target.value)}
            placeholder={t.comm_style_placeholder}
          />
        </div>
        <div className="field-row">
          <label>{t.response_length}:</label>
          <select
            value={user.responseLength}
            onChange={(e) => handleChange("responseLength", e.target.value)}
          >
            <option value="Short">{t.short}</option>
            <option value="Medium">{t.medium}</option>
            <option value="Long">{t.long}</option>
          </select>
        </div>
        <div className="field-row">
          <label>{t.tone}:</label>
          <select
            value={user.tone}
            onChange={(e) => handleChange("tone", e.target.value)}
          >
            <option value="Professional">{t.professional}</option>
            <option value="Casual">{t.casual}</option>
            <option value="Playful">{t.playful}</option>
            <option value="Formal">{t.formal}</option>
          </select>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t.other_notes}</legend>
        <div className="field-row-stacked">
          <label>{t.other_notes}:</label>
          <textarea
            rows={4}
            value={user.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder={t.user_notes_placeholder}
            style={{ resize: "vertical" }}
          />
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
            {t.profile_updated}
          </span>
        )}
      </div>
    </div>
  );
};
