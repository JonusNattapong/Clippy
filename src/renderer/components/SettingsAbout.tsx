import { useEffect, useState } from "react";
import { Versions } from "../../types/interfaces";
import { clippyApi } from "../clippyApi";
import { useTranslation } from "../contexts/SharedStateContext";

export const SettingsAbout: React.FC = () => {
  const [versions, setVersions] = useState<Partial<Versions>>({});
  const t = useTranslation();

  useEffect(() => {
    clippyApi.getVersions().then((versions) => {
      setVersions(versions);
    });
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-page-intro">
        <h3>{t.about}</h3>
        <p>{t.about_description}</p>
      </div>
      <fieldset>
        <legend>{t.version}</legend>
        <p>
          Clippy <code>{versions.clippy || "Unknown"}</code> (with Electron{" "}
          <code>{versions.electron || "Unknown"}</code>)
        </p>
      </fieldset>
      <p>{t.clippy_homage}</p>
      <h3 style={{ marginTop: 18 }}>{t.acknowledgments}</h3>
      <p>
        {t.made_by}{" "}
        <a
          href="https://github.com/felixrieseberg"
          target="_blank"
          rel="noreferrer"
        >
          Felix Rieseberg
        </a>{" "}
        {t.using}{" "}
        <a href="https://electronjs.org/" target="_blank" rel="noreferrer">
          Electron
        </a>{" "}
        with an AI chat experience centered on modern hosted models via API. The
        whimsical retro design was made possible by{" "}
        <a href="https://github.com/jdan" target="_blank" rel="noreferrer">
          Jordan Scales
        </a>
        .
      </p>
      <p>{t.character_design}</p>
      <p>{t.legal_notice}</p>
    </div>
  );
};
