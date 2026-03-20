import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { ANIMATION_KEYS_BRACKETS } from "../clippy-animation-helpers";
import { useChat } from "../contexts/ChatContext";
import {
  SharedStateContext,
  useTranslation,
} from "../contexts/SharedStateContext";
import { API_PROVIDER_DEFAULT_MODELS, TodoItem } from "../../sharedState";
import { streamChatCompletion } from "../api/chat-provider";
import { clippyApi } from "../clippyApi";
import { Translations } from "../i18n";
import { useCommandParser } from "../hooks/useCommandParser";
import { useMemoryCommands } from "../hooks/useMemoryCommands";
import {
  filterMessageContent,
  mergeTodoItems,
  ChoiceFlow,
} from "../helpers/filterMessageContent";

export type ChatProps = {
  style?: React.CSSProperties;
};

function getErrorMessage(error: unknown, t: Translations): string {
  if (error instanceof Error) {
    return error.message;
  }

  return (
    t.clippy_is_responding.replace("...", "") +
    " " +
    t.saving.replace("...", "")
  );
}

export function Chat({ style }: ChatProps) {
  const { setAnimationKey, setStatus, status, messages, addMessage } =
    useChat();
  const { settings } = useContext(SharedStateContext);
  const t = useTranslation();
  const { handleDesktopCommand, handleDesktopCommandStreaming } =
    useCommandParser();
  const { handleMemoryCommand } = useMemoryCommands();

  const [pendingChoiceFlow, setPendingChoiceFlow] = useState<ChoiceFlow | null>(
    null,
  );
  const [currentChoiceStepIndex, setCurrentChoiceStepIndex] = useState(0);
  const [choiceAnswers, setChoiceAnswers] = useState<Record<number, string>>(
    {},
  );
  const [customChoiceText, setCustomChoiceText] = useState("");
  const [showCustomChoiceInput, setShowCustomChoiceInput] = useState(false);
  const [focusedChoiceIndex, setFocusedChoiceIndex] = useState(0);
  const [streamingMessageContent, setStreamingMessageContent] =
    useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageCount = messages.length;
  const streamingLength = streamingMessageContent.length;

  useEffect(() => {
    void messageCount;
    void streamingLength;
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messageCount, streamingLength]);

  useEffect(() => {
    if (!pendingChoiceFlow) {
      setCurrentChoiceStepIndex(0);
      setChoiceAnswers({});
      setFocusedChoiceIndex(0);
      setShowCustomChoiceInput(false);
      setCustomChoiceText("");
      return;
    }

    setCurrentChoiceStepIndex(0);
    setChoiceAnswers({});
    setFocusedChoiceIndex(0);
    setShowCustomChoiceInput(false);
    setCustomChoiceText("");
  }, [pendingChoiceFlow]);

  const currentChoiceStep =
    pendingChoiceFlow?.steps[currentChoiceStepIndex] ?? null;
  const choiceStepCount = pendingChoiceFlow?.steps.length ?? 0;
  const currentChoiceAnswer = currentChoiceStep
    ? choiceAnswers[currentChoiceStepIndex] || ""
    : "";
  const currentChoiceAnswerIsCustom =
    !!currentChoiceStep &&
    !!currentChoiceAnswer &&
    !currentChoiceStep.options.includes(currentChoiceAnswer);

  useEffect(() => {
    if (!currentChoiceStep) {
      setFocusedChoiceIndex(0);
      setShowCustomChoiceInput(false);
      setCustomChoiceText("");
      return;
    }

    const selectedOptionIndex = currentChoiceStep.options.findIndex(
      (option) => option === currentChoiceAnswer,
    );

    setFocusedChoiceIndex(selectedOptionIndex >= 0 ? selectedOptionIndex : 0);
    setShowCustomChoiceInput(currentChoiceAnswerIsCustom);
    setCustomChoiceText(currentChoiceAnswerIsCustom ? currentChoiceAnswer : "");
  }, [currentChoiceAnswer, currentChoiceAnswerIsCustom, currentChoiceStep]);

  const handleAbortMessage = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const persistTodoItems = useCallback(async (nextTodoItems: TodoItem[]) => {
    await clippyApi.setState("settings.todoItems", nextTodoItems);
  }, []);

  const handleSendMessage = useCallback(
    async (
      message: string,
      images?: string[],
      files?: { name: string; type: string; size: number; content: string }[],
    ) => {
      if (status !== "idle") {
        return;
      }

      setPendingChoiceFlow(null);
      setCurrentChoiceStepIndex(0);
      setChoiceAnswers({});
      setShowCustomChoiceInput(false);
      setCustomChoiceText("");

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: message,
        sender: "user",
        createdAt: Date.now(),
        images,
        attachments: files,
      };

      await addMessage(userMessage);
      setStreamingMessageContent("");
      setStatus("thinking");

      try {
        const memoryCommandResult = await handleMemoryCommand(
          message,
          userMessage.id,
        );
        if (memoryCommandResult.handled) {
          setAnimationKey("Writing");
          await addMessage({
            id: crypto.randomUUID(),
            content: memoryCommandResult.response || "",
            sender: "clippy",
            createdAt: Date.now(),
          });
          setStatus("idle");
          return;
        }

        let commandHandled = false;
        let commandResponse = "";

        for await (const chunk of handleDesktopCommandStreaming(message)) {
          if (chunk.type === "progress") {
            setAnimationKey("Writing");
            setStreamingMessageContent(chunk.content);
          } else if (chunk.type === "result") {
            commandHandled = true;
            commandResponse = chunk.content;
          } else if (chunk.type === "error") {
            commandHandled = true;
            commandResponse = chunk.content;
          }
        }

        if (commandHandled) {
          if (
            settings.telegramNotifyOnErrors &&
            commandResponse.startsWith("❌")
          ) {
            void clippyApi.sendTelegramNotification({
              source: "rule",
              reason: "command_error",
              message:
                `Clippy command error: ${commandResponse.replace(/^❌\s*/, "")}`.slice(
                  0,
                  320,
                ),
            });
          }
          setAnimationKey("Writing");
          setStreamingMessageContent("");
          await addMessage({
            id: crypto.randomUUID(),
            content: commandResponse,
            sender: "clippy",
            createdAt: Date.now(),
          });
          setStatus("idle");
          return;
        }

        const provider = settings.apiProvider || "gemini";
        const model =
          settings.apiModel?.trim() || API_PROVIDER_DEFAULT_MODELS[provider];

        console.log(`Clippy: Action -> Provider: ${provider}, Model: ${model}`);
        const hasApiKey =
          provider === "ollama"
            ? true
            : provider === "gemini"
              ? !!(settings.geminiApiKey || settings.apiKey || "").trim()
              : !!(settings.apiKey || "").trim();
        if (!hasApiKey) {
          throw new Error(t.provide_api_key);
        }

        const telegramPrompt =
          settings.telegramNotificationsEnabled &&
          settings.telegramAgentNotificationsEnabled
            ? `

### Telegram Notifications
Telegram notifications are enabled for this user.
If an external reminder or alert would be genuinely useful, you may add one tag in this format:
[NOTIFY_TELEGRAM: short_reason | short notification message]
- Use only when the message is more useful outside the chat window
- Keep it concise and practical
- Never include secrets, API keys, passwords, or raw private data
- Use at most one notification tag per reply
`
            : "";

        const systemPrompt = (settings.systemPrompt || "")
          .replace("[USER_MEMORY]", "")
          .replace(
            /\[LIST OF ANIMATIONS\]/g,
            ANIMATION_KEYS_BRACKETS.join(", "),
          )
          .concat(telegramPrompt);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = streamChatCompletion({
          provider,
          model,
          message,
          images,
          attachments: files,
          history: messages,
          systemPrompt,
          temperature: settings.temperature,
          topK: settings.topK,
          signal: controller.signal,
        });

        let fullContent = "";
        let filteredContent = "";
        let hasSetAnimationKey = false;

        for await (const chunk of response) {
          if (fullContent === "") {
            setStatus("responding");
          }

          fullContent += chunk;

          if (!hasSetAnimationKey) {
            const { text, animationKey } = filterMessageContent(
              fullContent,
              { todoItems: settings.todoItems },
              t,
            );

            filteredContent = text;

            if (animationKey) {
              setAnimationKey(animationKey);
              hasSetAnimationKey = true;
            }
          } else {
            const { text } = filterMessageContent(
              fullContent,
              { todoItems: settings.todoItems },
              t,
            );
            filteredContent = text;
          }

          setStreamingMessageContent(filteredContent);
        }

        const {
          text: finalContent,
          memoryUpdate,
          statsUpdate,
          notifyTelegram,
          toolCalls,
          todoAdds,
          choiceFlow,
        } = filterMessageContent(
          fullContent,
          { todoItems: settings.todoItems },
          t,
        );

        if (todoAdds.length > 0) {
          try {
            await persistTodoItems(
              mergeTodoItems(settings.todoItems || [], todoAdds),
            );
          } catch (error) {
            console.error("Error saving todo items:", error);
          }
        }

        const assistantMessageId = crypto.randomUUID();
        const toolOutputs: string[] = [];

        if (memoryUpdate) {
          try {
            await clippyApi.submitMemoryCandidate(
              {
                content: memoryUpdate.content,
                category: memoryUpdate.category as any,
                importance: memoryUpdate.importance,
              },
              assistantMessageId,
              {
                autoApprove: settings.memoryAutoApprove ?? false,
              },
            );
          } catch (error) {
            console.error("Error creating memory:", error);
          }
        }

        if (toolCalls && toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            try {
              let result: { success: boolean; output?: string; error?: string };

              if (toolCall.tool === "web_search") {
                result = await clippyApi.webSearch(
                  toolCall.args.query,
                  toolCall.args.num_results
                    ? parseInt(toolCall.args.num_results)
                    : 5,
                );
              } else if (toolCall.tool === "fetch_url") {
                result = await clippyApi.fetchUrl(toolCall.args.url);
              } else {
                result = await clippyApi.executeTool(
                  toolCall.tool,
                  toolCall.args,
                );
              }

              console.log(`[Tool] ${toolCall.tool}:`, result);

              toolOutputs.push(
                result.success
                  ? (result.output || `${toolCall.tool} completed.`).trim()
                  : `Tool error (${toolCall.tool}): ${(result.error || "Unknown error").trim()}`,
              );

              const toolSummary = result.success
                ? `Action success: ${toolCall.tool} ${JSON.stringify(toolCall.args)} -> ${(result.output || "success").slice(0, 240)}`
                : `Action result: ${toolCall.tool} ${JSON.stringify(toolCall.args)} -> ${(result.error || "failed").slice(0, 240)}`;

              try {
                await clippyApi.recordActionOutcome({
                  toolName: toolCall.tool,
                  args: toolCall.args,
                  success: result.success,
                  summary: toolSummary,
                  source: assistantMessageId,
                });
              } catch (memoryError) {
                console.error(
                  `[Tool Memory Error] ${toolCall.tool}:`,
                  memoryError,
                );
              }

              if (!result.success && result.error) {
                console.error(`[Tool Error] ${toolCall.tool}:`, result.error);
                if (settings.telegramNotifyOnErrors) {
                  void clippyApi.sendTelegramNotification({
                    source: "rule",
                    reason: "tool_error",
                    message:
                      `Clippy hit an error while running ${toolCall.tool}: ${result.error}`.slice(
                        0,
                        320,
                      ),
                  });
                }
              }
            } catch (error) {
              console.error(`[Tool Error] ${toolCall.tool}:`, error);
              if (settings.telegramNotifyOnErrors) {
                void clippyApi.sendTelegramNotification({
                  source: "rule",
                  reason: "tool_error",
                  message:
                    `Clippy hit an error while running ${toolCall.tool}: ${error instanceof Error ? error.message : String(error)}`.slice(
                      0,
                      320,
                    ),
                });
              }
            }
          }
        }

        const assistantContent = [
          finalContent ||
            choiceFlow?.steps[0]?.prompt ||
            (todoAdds.length > 0 ? t.todo_added : ""),
          ...toolOutputs,
        ]
          .filter(Boolean)
          .join("\n\n");

        const assistantMessage: Message = {
          id: assistantMessageId,
          content: assistantContent,
          sender: "clippy",
          createdAt: Date.now(),
        };

        if (notifyTelegram) {
          try {
            const result = await clippyApi.sendTelegramNotification({
              source: "agent",
              reason: notifyTelegram.reason,
              message: notifyTelegram.message,
            });
            if (!result.success) {
              console.error(
                "[Telegram Notification Blocked]",
                result.error || "Unknown error",
              );
            }
          } catch (error) {
            console.error("[Telegram Notification Error]", error);
          }
        }

        try {
          await clippyApi.processConversationTurn(
            message,
            finalContent || assistantMessage.content || "",

            {
              bond: statsUpdate?.bond,
              happiness: statsUpdate?.happiness,
            },
            assistantMessage.id,
            {},
          );
        } catch (error) {
          console.error("Error processing conversation mood:", error);
        }

        await addMessage(assistantMessage);
        setPendingChoiceFlow(choiceFlow);

        try {
          const ttsEnabled = settings.ttsEnabled ?? false;
          console.log(
            "TTS enabled:",
            ttsEnabled,
            "Settings:",
            settings.ttsEnabled,
          );
          if (!ttsEnabled) {
            console.log("TTS is disabled, skipping speech");
            return;
          }

          const ttsVoice = settings.ttsVoice || "th-TH-PremwadeeNeural";
          console.log("Using TTS voice:", ttsVoice);
          const audioPath = await clippyApi.ttsSpeak(
            assistantMessage.content,
            ttsVoice,
          );
          const audio = new Audio(`file://${audioPath}`);
          audio.play();
          console.log("TTS audio playing");
        } catch (ttsError) {
          console.error("TTS Error:", ttsError);
          if (window.speechSynthesis) {
            const uiLang = settings.uiLanguage || "th";
            const utterance = new SpeechSynthesisUtterance(finalContent);
            utterance.lang = uiLang === "th" ? "th-TH" : "en-US";
            window.speechSynthesis.speak(utterance);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error(error);

        const errorMessage: Message = {
          id: crypto.randomUUID(),
          content: `Error: ${getErrorMessage(error, t)}`,
          sender: "clippy",
          createdAt: Date.now(),
        };

        await addMessage(errorMessage);

        if (settings.telegramNotifyOnErrors) {
          void clippyApi.sendTelegramNotification({
            source: "rule",
            reason: "chat_error",
            message:
              `Clippy encountered a chat error: ${getErrorMessage(error, t)}`.slice(
                0,
                320,
              ),
          });
        }
      } finally {
        abortControllerRef.current = null;
        setStreamingMessageContent("");
        setStatus("idle");
      }
    },
    [
      status,
      addMessage,
      setStatus,
      settings,
      messages,
      setAnimationKey,
      t,
      persistTodoItems,
      handleDesktopCommandStreaming,
      handleMemoryCommand,
    ],
  );

  const finalizeChoiceFlow = useCallback(
    async (answers: Record<number, string>) => {
      if (!pendingChoiceFlow) {
        return;
      }

      const summary = pendingChoiceFlow.steps
        .map((step, index) => {
          const answer = answers[index]?.trim() || t.choice_skipped_value;
          return `${index + 1}. ${step.prompt}: ${answer}`;
        })
        .join("\n");

      await handleSendMessage(`${t.choice_summary_intro}\n${summary}`);
    },
    [handleSendMessage, pendingChoiceFlow, t],
  );

  const advanceChoiceFlow = useCallback(
    async (answer?: string) => {
      if (!currentChoiceStep || !pendingChoiceFlow) {
        return;
      }

      const nextAnswers = { ...choiceAnswers };
      const trimmedAnswer = answer?.trim();

      if (trimmedAnswer) {
        nextAnswers[currentChoiceStepIndex] = trimmedAnswer;
      } else {
        delete nextAnswers[currentChoiceStepIndex];
      }

      setChoiceAnswers(nextAnswers);
      setShowCustomChoiceInput(false);
      setCustomChoiceText("");

      if (currentChoiceStepIndex >= pendingChoiceFlow.steps.length - 1) {
        await finalizeChoiceFlow(nextAnswers);
        return;
      }

      setCurrentChoiceStepIndex((currentValue) =>
        Math.min(currentValue + 1, pendingChoiceFlow.steps.length - 1),
      );
    },
    [
      choiceAnswers,
      currentChoiceStep,
      currentChoiceStepIndex,
      finalizeChoiceFlow,
      pendingChoiceFlow,
    ],
  );

  const handleChoiceSelection = useCallback(
    async (choice: string) => {
      await advanceChoiceFlow(choice);
    },
    [advanceChoiceFlow],
  );

  const handleSkipChoice = useCallback(async () => {
    await advanceChoiceFlow();
  }, [advanceChoiceFlow]);

  const handleCustomChoiceToggle = useCallback(() => {
    setShowCustomChoiceInput((currentValue) => !currentValue);
    setCustomChoiceText(currentChoiceAnswerIsCustom ? currentChoiceAnswer : "");
  }, [currentChoiceAnswer, currentChoiceAnswerIsCustom]);

  const handleCustomChoiceSubmit = useCallback(async () => {
    const trimmed = customChoiceText.trim();
    if (!trimmed) {
      return;
    }

    await advanceChoiceFlow(trimmed);
  }, [advanceChoiceFlow, customChoiceText]);

  useEffect(() => {
    if (!currentChoiceStep) {
      return;
    }

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (showCustomChoiceInput) {
        if (event.key === "Escape") {
          event.preventDefault();
          setShowCustomChoiceInput(false);
          setCustomChoiceText("");
        }
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        (event.target.tagName === "TEXTAREA" ||
          event.target.tagName === "INPUT")
      ) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        void handleSkipChoice();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        setFocusedChoiceIndex(
          (currentValue) =>
            (currentValue + 1) % currentChoiceStep.options.length,
        );
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        setFocusedChoiceIndex(
          (currentValue) =>
            (currentValue - 1 + currentChoiceStep.options.length) %
            currentChoiceStep.options.length,
        );
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        void handleChoiceSelection(
          currentChoiceStep.options[focusedChoiceIndex],
        );
        return;
      }

      const optionNumber = Number.parseInt(event.key, 10);
      if (
        Number.isInteger(optionNumber) &&
        optionNumber >= 1 &&
        optionNumber <= currentChoiceStep.options.length
      ) {
        event.preventDefault();
        void handleChoiceSelection(currentChoiceStep.options[optionNumber - 1]);
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [
    focusedChoiceIndex,
    currentChoiceStep,
    handleChoiceSelection,
    handleSkipChoice,
    showCustomChoiceInput,
  ]);

  const choiceCount = currentChoiceStep?.options.length ?? 0;
  const activeChoiceIndex =
    currentChoiceStep && choiceCount > 0
      ? Math.min(focusedChoiceIndex, choiceCount - 1)
      : 0;
  const activeChoiceNumber = currentChoiceStepIndex + 1;

  return (
    <div style={style} className="chat-container">
      <div className="chat-history">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {status === "responding" && (
          <Message
            message={{
              id: "streaming",
              content: streamingMessageContent,
              sender: "clippy",
              createdAt: Date.now(),
            }}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSendMessage} onAbort={handleAbortMessage} />
      {pendingChoiceFlow && currentChoiceStep && (
        <div className="choice-dialog-backdrop">
          <div className="choice-dialog-panel">
            <div className="choice-dialog-header">
              <div>
                <div className="choice-dialog-title">{t.choose_one}</div>
                <div className="choice-dialog-prompt">
                  {currentChoiceStep.prompt}
                </div>
              </div>
              <div className="choice-dialog-progress" aria-live="polite">
                <button
                  type="button"
                  className="choice-dialog-progress-button"
                  onClick={() =>
                    setCurrentChoiceStepIndex((currentValue) =>
                      Math.max(currentValue - 1, 0),
                    )
                  }
                  aria-label={t.choice_previous}
                  disabled={currentChoiceStepIndex === 0}
                >
                  {"<"}
                </button>
                <span className="choice-dialog-progress-label">
                  {activeChoiceNumber} of {choiceStepCount}
                </span>
                <button
                  type="button"
                  className="choice-dialog-progress-button"
                  onClick={() =>
                    setCurrentChoiceStepIndex((currentValue) =>
                      Math.min(currentValue + 1, choiceStepCount - 1),
                    )
                  }
                  aria-label={t.choice_next}
                  disabled={currentChoiceStepIndex >= choiceStepCount - 1}
                >
                  {">"}
                </button>
              </div>
            </div>
            <div className="choice-dialog-options">
              {currentChoiceStep.options.map((option, index) => {
                const isActive = index === activeChoiceIndex;
                const isSelected = option === currentChoiceAnswer;

                return (
                  <button
                    key={option}
                    type="button"
                    className={`choice-dialog-option${isActive ? " is-active" : ""}${isSelected ? " is-selected" : ""}`}
                    onClick={() => void handleChoiceSelection(option)}
                    onMouseEnter={() => setFocusedChoiceIndex(index)}
                    onFocus={() => setFocusedChoiceIndex(index)}
                  >
                    <span className="choice-dialog-option-number">
                      {index + 1}
                    </span>
                    <span className="choice-dialog-option-copy">
                      <span className="choice-dialog-option-label">
                        {option}
                      </span>
                    </span>
                    <span
                      className="choice-dialog-option-arrow"
                      aria-hidden="true"
                    >
                      {">"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="choice-dialog-footer">
              <div className="choice-dialog-options">
                <button
                  type="button"
                  className="choice-dialog-option choice-dialog-option-secondary"
                  onClick={handleCustomChoiceToggle}
                >
                  {t.type_your_own}
                </button>
                <button
                  type="button"
                  className="choice-dialog-option choice-dialog-option-ghost"
                  onClick={() => void handleSkipChoice()}
                >
                  {t.skip_choice}
                </button>
                {currentChoiceStepIndex >= choiceStepCount - 1 && (
                  <button
                    type="button"
                    className="choice-dialog-option choice-dialog-option-primary"
                    onClick={() => void finalizeChoiceFlow(choiceAnswers)}
                  >
                    {t.choice_finish}
                  </button>
                )}
              </div>
            </div>
            {showCustomChoiceInput && (
              <div className="choice-dialog-custom">
                <textarea
                  value={customChoiceText}
                  onChange={(event) => setCustomChoiceText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleCustomChoiceSubmit();
                    }
                  }}
                  placeholder={t.custom_reply_placeholder}
                  rows={3}
                />
                <div className="choice-dialog-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomChoiceInput(false);
                      setCustomChoiceText("");
                    }}
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCustomChoiceSubmit()}
                  >
                    {t.send_custom_choice}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
