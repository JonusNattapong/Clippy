import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { DEFAULT_SETTINGS, SharedState } from "../../sharedState";
import { clippyApi } from "../clippyApi";
import { getTranslations, Language } from "../i18n";

const EMPTY_SHARED_STATE: SharedState = {
  settings: {
    ...DEFAULT_SETTINGS,
    systemPrompt: undefined,
  },
};

export const SharedStateContext =
  createContext<SharedState>(EMPTY_SHARED_STATE);

export const SharedStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sharedState, setSharedState] =
    useState<SharedState>(EMPTY_SHARED_STATE);

  useEffect(() => {
    const fetchSharedState = async () => {
      const state = await clippyApi.getFullState();
      setSharedState(state);
    };

    fetchSharedState();

    clippyApi.offStateChanged();
    clippyApi.onStateChanged((state) => {
      setSharedState(state);
    });

    return () => {
      clippyApi.offStateChanged();
    };
  }, []);

  return (
    <SharedStateContext.Provider value={sharedState}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = () => {
  const sharedState = useContext(SharedStateContext);

  if (!sharedState) {
    throw new Error("useSharedState must be used within a SharedStateProvider");
  }

  return sharedState;
};

export const useTranslation = () => {
  const { settings } = useSharedState();
  const t = useMemo(
    () => getTranslations((settings.uiLanguage || "en") as Language),
    [settings.uiLanguage],
  );
  return t;
};
