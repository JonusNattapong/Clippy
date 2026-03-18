import { useEffect, useState, useCallback, useRef } from "react";
import {
  BUBBLE_MESSAGE_PROMPT,
  BUBBLE_MESSAGE_SYSTEM_PROMPT,
} from "../../bubble-message-config";
import { clippyApi } from "../clippyApi";

interface SpeechBubbleProps {
  onBubbleClick?: () => void;
}

const AUTO_DISMISS_MS = 10000;
const PROACTIVE_INTERVAL_MS = 1000 * 60 * 30; // 30 minutes
const INITIAL_DELAY_MS = 5000;

const FALLBACK_GREETINGS = [
  "สวัสดีจ้า! มีอะไรให้ช่วยมั้ย? 📎✨",
  "เฮ้! คลิกเพื่อคุยกันสิ 💬",
  "ว่างมั้ย? มาคุยกัน! 😊",
  "อย่าลืมดื่มน้ำนะ! 💧",
  "วันนี้เป็นยังไงบ้าง? 🌟",
];

export function SpeechBubble({ onBubbleClick }: SpeechBubbleProps) {
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const dismissTimer = useRef<number | undefined>(undefined);
  const proactiveTimer = useRef<number | undefined>(undefined);
  const hasGreeted = useRef(false);
  const activeRequestId = useRef<string | null>(null);

  const showBubble = useCallback((text: string) => {
    // Strip any special tags that might slip through
    let clean = text
      .replace(/\[[\w_]+:.*?\]/g, "")
      .replace(/^\[[\w]+\]\s*/, "")
      .trim();

    if (clean.length > 80) {
      clean = clean.substring(0, 77) + "...";
    }

    if (!clean) return;

    setIsFadingOut(false);
    setBubbleText(clean);
    setIsVisible(true);

    if (dismissTimer.current) {
      window.clearTimeout(dismissTimer.current);
    }

    dismissTimer.current = window.setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
        setBubbleText(null);
        setIsFadingOut(false);
      }, 400);
    }, AUTO_DISMISS_MS);
  }, []);

  const dismissBubble = useCallback(() => {
    if (dismissTimer.current) {
      window.clearTimeout(dismissTimer.current);
    }
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      setBubbleText(null);
      setIsFadingOut(false);
    }, 300);
  }, []);

  const requestAiMessage = useCallback(async () => {
    const requestId = crypto.randomUUID();
    activeRequestId.current = requestId;

    try {
      const result = await clippyApi.generateBubbleText({
        prompt: BUBBLE_MESSAGE_PROMPT,
        systemPrompt: BUBBLE_MESSAGE_SYSTEM_PROMPT,
      });

      if (activeRequestId.current !== requestId) {
        return;
      }

      activeRequestId.current = null;

      if (result.text.trim()) {
        showBubble(result.text);
        return;
      }

      const fallback =
        FALLBACK_GREETINGS[
          Math.floor(Math.random() * FALLBACK_GREETINGS.length)
        ];
      showBubble(fallback);
    } catch {
      if (activeRequestId.current !== requestId) {
        return;
      }

      activeRequestId.current = null;

      const fallback =
        FALLBACK_GREETINGS[
          Math.floor(Math.random() * FALLBACK_GREETINGS.length)
        ];
      showBubble(fallback);
    }
  }, [showBubble]);

  // Initial AI greeting after a short delay
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      proactiveTimer.current = window.setTimeout(() => {
        requestAiMessage();
      }, INITIAL_DELAY_MS);
    }

    return () => {
      if (proactiveTimer.current) {
        window.clearTimeout(proactiveTimer.current);
      }
    };
  }, [requestAiMessage]);

  // Periodic AI messages every 30 minutes
  useEffect(() => {
    const interval = window.setInterval(() => {
      requestAiMessage();
    }, PROACTIVE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [requestAiMessage]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dismissTimer.current) {
        window.clearTimeout(dismissTimer.current);
      }
      activeRequestId.current = null;
    };
  }, []);

  if (!isVisible || !bubbleText) {
    return null;
  }

  return (
    <div
      className={`speech-bubble ${isFadingOut ? "speech-bubble-fadeout" : "speech-bubble-fadein"}`}
      onClick={() => {
        dismissBubble();
        onBubbleClick?.();
      }}
      style={{ cursor: "pointer" }}
    >
      <div className="speech-bubble-text">{bubbleText}</div>
      <div className="speech-bubble-tail" />
    </div>
  );
}
