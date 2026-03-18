import { useEffect, useState, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { ANIMATIONS, Animation } from "../clippy-animations";
import {
  EMPTY_ANIMATION,
  getRandomIdleAnimation,
} from "../clippy-animation-helpers";
import { useChat } from "../contexts/ChatContext";
import { log } from "../logging";
import { useDebugState } from "../contexts/DebugContext";
import { clippyApi } from "../clippyApi";

const WAIT_TIME = 6000;

export function Clippy() {
  const {
    animationKey,
    status,
    setStatus,
    setIsChatWindowOpen,
    isChatWindowOpen,
  } = useChat();
  const { enableDragDebug } = useDebugState();
  const [animation, setAnimation] = useState<Animation>(EMPTY_ANIMATION);
  const [animationTimeoutId, setAnimationTimeoutId] = useState<
    number | undefined
  >(undefined);

  const playAnimation = useCallback((key: string) => {
    if (ANIMATIONS[key]) {
      log(`Playing animation`, { key });

      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
      }

      setAnimation(ANIMATIONS[key]);
      setAnimationTimeoutId(
        window.setTimeout(() => {
          setAnimation(ANIMATIONS.Default);
        }, ANIMATIONS[key].length + 200),
      );
    } else {
      log(`Animation not found`, { key });
    }
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatWindowOpen(!isChatWindowOpen);
  }, [isChatWindowOpen, setIsChatWindowOpen]);

  useEffect(() => {
    const playRandomIdleAnimation = () => {
      if (status !== "idle") return;

      const randomIdleAnimation = getRandomIdleAnimation(animation);
      setAnimation(randomIdleAnimation);

      // Reset back to default after 6 seconds and schedule next animation
      setAnimationTimeoutId(
        window.setTimeout(() => {
          setAnimation(ANIMATIONS.Default);
          setAnimationTimeoutId(
            window.setTimeout(playRandomIdleAnimation, WAIT_TIME),
          );
        }, randomIdleAnimation.length),
      );
    };

    if (status === "welcome" && animation === EMPTY_ANIMATION) {
      setAnimation(ANIMATIONS.Show);
      setTimeout(() => {
        setStatus("idle");
      }, ANIMATIONS.Show.length + 200);
    } else if (status === "idle") {
      if (!animationTimeoutId) {
        playRandomIdleAnimation();
      }
    }

    // Clean up timeouts when component unmounts or status changes
    return () => {
      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
      }
    };
  }, [status]);

  useEffect(() => {
    log(`New animation key`, { animationKey });
    playAnimation(animationKey);
  }, [animationKey, playAnimation]);

  const handlePointerDown = useCallback(
    async (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const position = await clippyApi.getMainWindowPosition();
      if (!position) {
        return;
      }

      const startMouseX = event.screenX;
      const startMouseY = event.screenY;

      let frameId: number | null = null;
      let nextPosition = position;

      const flushPosition = () => {
        frameId = null;
        void clippyApi.setMainWindowPosition(nextPosition.x, nextPosition.y);
      };

      const handlePointerMove = (moveEvent: PointerEvent) => {
        nextPosition = {
          x: position.x + (moveEvent.screenX - startMouseX),
          y: position.y + (moveEvent.screenY - startMouseY),
        };

        if (frameId === null) {
          frameId = window.requestAnimationFrame(flushPosition);
        }
      };

      const stopDragging = () => {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
          frameId = null;
        }
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopDragging);
        window.removeEventListener("pointercancel", stopDragging);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopDragging);
      window.addEventListener("pointercancel", stopDragging);
    },
    [],
  );

  return (
    <div>
      <div
        className="app-no-select"
        onPointerDown={handlePointerDown}
        style={{
          position: "absolute",
          height: "93px",
          width: "124px",
          backgroundColor: enableDragDebug ? "blue" : "transparent",
          zIndex: 100,
          cursor: "grab",
        }}
      >
        {/* Chat Toggle Area */}
        <div
          className="app-no-drag"
          style={{
            position: "absolute",
            height: "80px",
            width: "45px",
            backgroundColor: enableDragDebug ? "red" : "transparent",
            zIndex: 110,
            right: "40px",
            top: "2px",
            cursor: "help",
            border: "none",
          }}
          onClick={toggleChat}
        ></div>
      </div>
      <img
        className="app-no-select"
        src={animation.src}
        draggable={false}
        alt="Clippy"
        style={{ position: "relative", zIndex: 6 }}
      />
    </div>
  );
}
