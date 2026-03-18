import { useState, useEffect } from "react";
import { clippyApi } from "../clippyApi";
import { Checkbox } from "./Checkbox";
import { useTranslation } from "../contexts/SharedStateContext";

const VOICE_OPTIONS = [
  {
    value: "th-TH-PremwadeeNeural",
    label: "Premwadee (Thai - Female)",
    locale: "Thai",
  },
  {
    value: "th-TH-NachananNeural",
    label: "Nachanan (Thai - Male)",
    locale: "Thai",
  },
  {
    value: "en-US-MichelleNeural",
    label: "Michelle (English - Female)",
    locale: "English",
  },
  {
    value: "en-US-GuyNeural",
    label: "Guy (English - Male)",
    locale: "English",
  },
  {
    value: "en-GB-SoniaNeural",
    label: "Sonia (British - Female)",
    locale: "English",
  },
  {
    value: "en-GB-RyanNeural",
    label: "Ryan (British - Male)",
    locale: "English",
  },
  {
    value: "ja-JP-NanamiNeural",
    label: "Nanami (Japanese - Female)",
    locale: "Japanese",
  },
  {
    value: "ko-KR-SunHiNeural",
    label: "SunHi (Korean - Female)",
    locale: "Korean",
  },
  {
    value: "zh-CN-XiaoxiaoNeural",
    label: "Xiaoxiao (Chinese - Female)",
    locale: "Chinese",
  },
];

const RATE_OPTIONS = [
  { value: "-50%", label: "Slow (0.5x)" },
  { value: "-25%", label: "Slightly Slow (0.75x)" },
  { value: "+0%", label: "Normal (1x)" },
  { value: "+25%", label: "Slightly Fast (1.25x)" },
  { value: "+50%", label: "Fast (1.5x)" },
];

export const SettingsTTS: React.FC = () => {
  const t = useTranslation();
  const [ttsVoice, setTtsVoice] = useState("th-TH-PremwadeeNeural");
  const [ttsRate, setTtsRate] = useState("+0%");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const voice = await clippyApi.getState("settings.ttsVoice");
      const rate = await clippyApi.getState("settings.ttsRate");
      const enabled = await clippyApi.getState("settings.ttsEnabled");
      if (voice) setTtsVoice(voice);
      if (rate) setTtsRate(rate);
      if (enabled !== undefined) setTtsEnabled(enabled);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await clippyApi.setState("settings.ttsVoice", ttsVoice);
    await clippyApi.setState("settings.ttsRate", ttsRate);
    await clippyApi.setState("settings.ttsEnabled", ttsEnabled);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const testText = "สวัสดีครับ! นี่คือการทดสอบเสียงพูดภาษาไทย";
      await clippyApi.ttsSpeak(testText, ttsVoice);
    } catch (error) {
      console.error("TTS Test Error:", error);
    }
    setTesting(false);
  };

  const groupedVoices = VOICE_OPTIONS.reduce(
    (acc, voice) => {
      if (!acc[voice.locale]) {
        acc[voice.locale] = [];
      }
      acc[voice.locale].push(voice);
      return acc;
    },
    {} as Record<string, typeof VOICE_OPTIONS>,
  );

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.tts_title}</h3>
        <p>{t.tts_description}</p>
      </div>

      <fieldset style={{ marginBottom: "20px" }}>
        <legend>{t.tts_voice_settings}</legend>

        <Checkbox
          id="ttsEnabled"
          label={t.tts_enable}
          checked={ttsEnabled}
          onChange={(checked) => setTtsEnabled(checked)}
        />

        <div className="field-row" style={{ marginBottom: "15px" }}>
          <label style={{ minWidth: "120px" }}>{t.tts_voice}:</label>
          <select
            value={ttsVoice}
            onChange={(e) => setTtsVoice(e.target.value)}
            style={{ flex: 1, maxWidth: "300px" }}
          >
            {Object.entries(groupedVoices).map(([locale, voices]) => (
              <optgroup key={locale} label={locale}>
                {voices.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="field-row" style={{ marginBottom: "15px" }}>
          <label style={{ minWidth: "120px" }}>{t.tts_speed}:</label>
          <select
            value={ttsRate}
            onChange={(e) => setTtsRate(e.target.value)}
            style={{ flex: 1, maxWidth: "200px" }}
          >
            {RATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <fieldset style={{ marginBottom: "20px" }}>
        <legend>{t.tts_preview}</legend>
        <div style={{ marginBottom: "10px", color: "#666", fontSize: "12px" }}>
          {t.tts_preview_description}
        </div>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !ttsEnabled}
        >
          {testing ? t.tts_playing : t.tts_test_voice}
        </button>
      </fieldset>

      <div className="field-row">
        <button type="button" onClick={handleSave}>
          {saved ? t.saved : t.tts_save_settings}
        </button>
      </div>

      {saved && (
        <div style={{ marginTop: "10px", color: "green" }}>
          {t.settings_saved_successfully}
        </div>
      )}
    </div>
  );
};
