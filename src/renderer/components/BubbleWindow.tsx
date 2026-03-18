import { useCallback, useState } from "react";
import type React from "react";
import { clippyApi } from "../clippyApi";
import { Chat } from "./Chat";
import { Settings } from "./Settings";
import { useBubbleView } from "../contexts/BubbleViewContext";
import { Chats } from "./Chats";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { FirstRunSetup } from "./FirstRunSetup";

export function Bubble() {
  const { currentView, setCurrentView } = useBubbleView();
  const { settings } = useSharedState();
  const t = useTranslation();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const moodLabel = getMoodLabel(settings.clippyMood || "calm", t);
  const todoItems = settings.todoItems || [];
  const pendingTodoCount = todoItems.filter(
    (todoItem) => !todoItem.completed,
  ).length;

  const containerStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const chatStyle = {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    minHeight: 0,
  };

  let content = null;
  const isFirstRun = !settings.hasCompletedOnboarding;

  if (isFirstRun) {
    content = <FirstRunSetup />;
  } else if (currentView === "chat") {
    content = <Chat style={chatStyle} />;
  } else if (currentView.startsWith("settings")) {
    content = <Settings onClose={() => setCurrentView("chat")} />;
  } else if (currentView === "chats") {
    content = <Chats onClose={() => setCurrentView("chat")} />;
  }

  const handleSettingsClick = useCallback(() => {
    if (currentView.startsWith("settings")) {
      setCurrentView("chat");
    } else {
      setCurrentView("settings");
    }
  }, [setCurrentView, currentView]);

  const handleLanguageToggle = useCallback(() => {
    const nextLanguage = settings.uiLanguage === "th" ? "en" : "th";
    void clippyApi.setState("settings.uiLanguage", nextLanguage);
  }, [settings.uiLanguage]);

  const handleTodoToggle = useCallback(() => {
    setIsTodoListOpen((currentValue) => !currentValue);
  }, []);

  const handleTodoStatusToggle = useCallback(
    (todoId: string) => {
      const nextTodoItems = todoItems.map((todoItem) =>
        todoItem.id === todoId
          ? {
              ...todoItem,
              completed: !todoItem.completed,
              updatedAt: Date.now(),
            }
          : todoItem,
      );

      void clippyApi.setState("settings.todoItems", nextTodoItems);
    },
    [todoItems],
  );

  const handleTodoDelete = useCallback(
    (todoId: string) => {
      void clippyApi.setState(
        "settings.todoItems",
        todoItems.filter((todoItem) => todoItem.id !== todoId),
      );
    },
    [todoItems],
  );

  return (
    <div className="bubble-container window" style={containerStyle}>
      <div className="app-drag title-bar">
        <div className="title-bar-text">
          {isFirstRun ? t.first_run_title : t.chat_with_clippy}
        </div>
        <div className="title-bar-controls app-no-drag">
          <button
            type="button"
            className="title-action-button"
            onClick={handleLanguageToggle}
          >
            {settings.uiLanguage === "th" ? "EN" : "TH"}
          </button>
          {!isFirstRun && (
            <button
              type="button"
              className="title-action-button title-action-button-todo"
              onClick={handleTodoToggle}
            >
              {t.todo_open}
              <span className="title-action-count">{pendingTodoCount}</span>
            </button>
          )}
          {!isFirstRun && (
            <button
              type="button"
              className="title-action-button"
              onClick={() => setCurrentView("chats")}
            >
              {t.chats}
            </button>
          )}
          {!isFirstRun && (
            <button
              type="button"
              className="title-action-button"
              onClick={handleSettingsClick}
            >
              {t.settings}
            </button>
          )}
          <button
            type="button"
            aria-label="Minimize"
            onClick={() => clippyApi.minimizeChatWindow()}
          >
            <span
              style={{ fontSize: "12px", position: "relative", top: "-1px" }}
            >
              ─
            </span>
          </button>
          <button
            type="button"
            aria-label={isMaximized ? "Restore" : "Maximize"}
            onClick={() => {
              clippyApi.maximizeChatWindow();
              setIsMaximized(!isMaximized);
            }}
          >
            <span style={{ fontSize: "14px" }}>□</span>
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={() => clippyApi.toggleChatWindow()}
          >
            <span style={{ fontSize: "16px", fontWeight: "normal" }}>×</span>
          </button>
        </div>
      </div>
      {!isFirstRun && (
        <div className="stats-bar">
          <div className="stat-item">
            <span>{t.bond}:</span>
            <div className="stat-progress">
              <div
                className="stat-fill bond-fill"
                style={{ width: `${settings.bondLevel}%` }}
              />
            </div>
          </div>
          <div className="stat-item">
            <span>{t.joy}:</span>
            <div className="stat-progress">
              <div
                className="stat-fill joy-fill"
                style={{ width: `${settings.happiness}%` }}
              />
            </div>
          </div>
          <div className="stat-item stat-item-mood">
            <span>{t.current_mood}:</span>
            <div className="mood-badge">
              {moodLabel}
              <small>
                {" "}
                {settings.clippyResponseStyle === "gentle"
                  ? t.response_gentle
                  : settings.clippyResponseStyle === "energetic"
                    ? t.response_energetic
                    : t.response_balanced}
              </small>
            </div>
          </div>
        </div>
      )}
      <div
        className="window-content"
        style={currentView === "chat" ? { minHeight: 0 } : {}}
      >
        {content}
      </div>
      {isTodoListOpen && !isFirstRun && (
        <div className="todo-dialog-backdrop">
          <div className="todo-dialog-panel">
            <div className="todo-dialog-header">
              <div>
                <strong>{t.todo_list}</strong>
              </div>
              <button type="button" onClick={handleTodoToggle}>
                {t.cancel}
              </button>
            </div>
            {todoItems.length === 0 ? (
              <div className="todo-empty-state">{t.todo_empty}</div>
            ) : (
              <div className="todo-list">
                {todoItems.map((todoItem) => (
                  <div
                    key={todoItem.id}
                    className={`todo-item ${todoItem.completed ? "is-complete" : ""}`}
                  >
                    <div className="todo-item-copy">
                      <div className="todo-item-title">{todoItem.title}</div>
                      {todoItem.note && (
                        <div className="todo-item-note">{todoItem.note}</div>
                      )}
                      <div className="todo-item-status">
                        {todoItem.completed ? t.todo_done : t.todo_pending}
                      </div>
                    </div>
                    <div className="todo-item-actions">
                      <button
                        type="button"
                        onClick={() => handleTodoStatusToggle(todoItem.id)}
                      >
                        {todoItem.completed
                          ? t.todo_mark_pending
                          : t.todo_mark_done}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTodoDelete(todoItem.id)}
                      >
                        {t.todo_delete}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getMoodLabel(
  mood: NonNullable<ReturnType<typeof useSharedState>["settings"]["clippyMood"]>,
  t: ReturnType<typeof useTranslation>,
) {
  switch (mood) {
    case "playful":
      return t.mood_playful;
    case "supportive":
      return t.mood_supportive;
    case "excited":
      return t.mood_excited;
    case "focused":
      return t.mood_focused;
    case "concerned":
      return t.mood_concerned;
    case "calm":
    default:
      return t.mood_calm;
  }
}
