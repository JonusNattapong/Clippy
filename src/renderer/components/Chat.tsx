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
  ChoicePrompt,
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
  const { handleDesktopCommand } = useCommandParser();
  const { handleMemoryCommand } = useMemoryCommands();

  const [pendingChoice, setPendingChoice] = useState<ChoicePrompt | null>(null);
  const [customChoiceText, setCustomChoiceText] = useState("");
  const [showCustomChoiceInput, setShowCustomChoiceInput] = useState(false);
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

  const handleAbortMessage = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const persistTodoItems = useCallback(async (nextTodoItems: TodoItem[]) => {
    await clippyApi.setState("settings.todoItems", nextTodoItems);
  }, []);

  const handleSendMessage = useCallback(
    async (message: string, images?: string[]) => {
      if (status !== "idle") {
        return;
      }

      setPendingChoice(null);
      setShowCustomChoiceInput(false);
      setCustomChoiceText("");

      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: message,
        sender: "user",
        createdAt: Date.now(),
        images,
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

        const desktopCommandResult = await handleDesktopCommand(message);
        if (desktopCommandResult.handled) {
          if (
            settings.telegramNotifyOnErrors &&
            desktopCommandResult.response?.startsWith("❌")
          ) {
            void clippyApi.sendTelegramNotification({
              source: "rule",
              reason: "command_error",
              message:
                `Clippy command error: ${desktopCommandResult.response.replace(/^❌\s*/, "")}`.slice(
                  0,
                  320,
                ),
            });
          }
          setAnimationKey("Writing");
          await addMessage({
            id: crypto.randomUUID(),
            content: desktopCommandResult.response || "",
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
          choicePrompt,
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

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content:
            finalContent ||
            choicePrompt?.prompt ||
            (todoAdds.length > 0 ? t.todo_added : ""),
          sender: "clippy",
          createdAt: Date.now(),
        };

        if (memoryUpdate) {
          try {
            await clippyApi.submitMemoryCandidate(
              {
                content: memoryUpdate.content,
                category: memoryUpdate.category as any,
                importance: memoryUpdate.importance,
              },
              assistantMessage.id,
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

              const toolSummary = result.success
                ? `Action success: ${toolCall.tool} ${JSON.stringify(toolCall.args)} -> ${(result.output || "success").slice(0, 240)}`
                : `Action result: ${toolCall.tool} ${JSON.stringify(toolCall.args)} -> ${(result.error || "failed").slice(0, 240)}`;

              try {
                await clippyApi.recordActionOutcome({
                  toolName: toolCall.tool,
                  args: toolCall.args,
                  success: result.success,
                  summary: toolSummary,
                  source: assistantMessage.id,
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
        setPendingChoice(choicePrompt);

        try {
          const ttsEnabled = settings.ttsEnabled ?? true;
          if (!ttsEnabled) return;

          const ttsVoice = settings.ttsVoice || "th-TH-PremwadeeNeural";
          const audioPath = await clippyApi.ttsSpeak(finalContent, ttsVoice);
          const audio = new Audio(`file://${audioPath}`);
          audio.play();
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
      handleDesktopCommand,
      handleMemoryCommand,
    ],
  );

  const handleChoiceSelection = useCallback(
    async (choice: string) => {
      await handleSendMessage(choice);
    },
    [handleSendMessage],
  );

  const handleCustomChoiceSubmit = useCallback(async () => {
    const trimmed = customChoiceText.trim();
    if (!trimmed) {
      return;
    }

    await handleSendMessage(trimmed);
  }, [customChoiceText, handleSendMessage]);

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
      {pendingChoice && (
        <div className="choice-dialog-backdrop">
          <div className="choice-dialog-panel">
            <div className="choice-dialog-title">{t.choose_one}</div>
            <div className="choice-dialog-prompt">{pendingChoice.prompt}</div>
            <div className="choice-dialog-options">
              {pendingChoice.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="choice-dialog-option"
                  onClick={() => void handleChoiceSelection(option)}
                >
                  {option}
                </button>
              ))}
              <button
                type="button"
                className="choice-dialog-option choice-dialog-option-secondary"
                onClick={() =>
                  setShowCustomChoiceInput((currentValue) => !currentValue)
                }
              >
                {t.type_your_own}
              </button>
            </div>
            {showCustomChoiceInput && (
              <div className="choice-dialog-custom">
                <textarea
                  value={customChoiceText}
                  onChange={(event) => setCustomChoiceText(event.target.value)}
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
