import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import {
  ANIMATION_KEYS,
  ANIMATION_KEYS_BRACKETS,
} from "../clippy-animation-helpers";
import { useChat } from "../contexts/ChatContext";
import {
  SharedStateContext,
  useTranslation,
} from "../contexts/SharedStateContext";
import { API_PROVIDER_DEFAULT_MODELS, TodoItem } from "../../sharedState";
import { streamChatCompletion } from "../api/chat-provider";
import { clippyApi } from "../clippyApi";
import { Memory, MemoryStats } from "../../types/interfaces";
import { Translations } from "../i18n";

export type ChatProps = {
  style?: React.CSSProperties;
};

function getErrorMessage(error: unknown, t: Translations): string {
  if (error instanceof Error) {
    return error.message;
  }

  return (
    t.clippy_is_responding.replace("...", "") + " " + t.saving.replace("...", "")
  ); // Fallback "Something went wrong" equivalent
}

export function Chat({ style }: ChatProps) {
  const { setAnimationKey, setStatus, status, messages, addMessage } =
    useChat();
  const { settings } = useContext(SharedStateContext);
  const t = useTranslation();
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
        const memoryCommandResult = await clippyApi.handleMemoryCommand(
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

        const provider = settings.apiProvider || "gemini";
        const model =
          settings.apiModel?.trim() || API_PROVIDER_DEFAULT_MODELS[provider];

        console.log(`Clippy: Action -> Provider: ${provider}, Model: ${model}`);
        const hasApiKey =
          provider === "gemini"
            ? !!(settings.geminiApiKey || settings.apiKey || "").trim()
            : !!(settings.apiKey || "").trim();
        if (!hasApiKey) {
          throw new Error(t.provide_api_key);
        }

        // Fetch memories and stats for context injection
        const [memories, stats] = await Promise.all([
          clippyApi.getAllMemories(),
          clippyApi.getMemoryStats(),
        ]);

        // Build memory context
        const memoryContext = buildMemoryContext(memories, stats, t);

        // Inject memories into system prompt
        const systemPrompt = (settings.systemPrompt || "")
          .replace("[USER_MEMORY]", memoryContext)
          .replace(
            /\[LIST OF ANIMATIONS\]/g,
            ANIMATION_KEYS_BRACKETS.join(", "),
          );

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
            const { text, animationKey } = filterMessageContent(fullContent);

            filteredContent = text;

            if (animationKey) {
              setAnimationKey(animationKey);
              hasSetAnimationKey = true;
            }
          } else {
            // Once we have an animation key, we still need to filter the text
            // but we can be more efficient. For now, let's just keep the text updated.
            const { text } = filterMessageContent(fullContent);
            filteredContent = text;
          }

          setStreamingMessageContent(filteredContent);
        }

        const {
          text: finalContent,
          memoryUpdate,
          statsUpdate,
          toolCalls,
          todoAdds,
          choicePrompt,
        } = filterMessageContent(fullContent);

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

        // Handle memory update using new structured memory system
        if (memoryUpdate) {
          try {
            await clippyApi.createMemory(
              memoryUpdate.content,
              memoryUpdate.category,
              memoryUpdate.importance,
              assistantMessage.id,
            );
          } catch (error) {
            console.error("Error creating memory:", error);
          }
        }

        // Handle tool calls
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

              if (!result.success && result.error) {
                console.error(`[Tool Error] ${toolCall.tool}:`, result.error);
              }
            } catch (error) {
              console.error(`[Tool Error] ${toolCall.tool}:`, error);
            }
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
          );
        } catch (error) {
          console.error("Error processing conversation mood:", error);
        }

        await addMessage(assistantMessage);
        setPendingChoice(choicePrompt);

        // Use Edge TTS for better quality
        try {
          const ttsEnabled = settings.ttsEnabled ?? true;
          if (!ttsEnabled) return;

          const ttsVoice = settings.ttsVoice || "th-TH-PremwadeeNeural";
          const audioPath = await clippyApi.ttsSpeak(finalContent, ttsVoice);
          const audio = new Audio(`file://${audioPath}`);
          audio.play();
        } catch (ttsError) {
          console.error("TTS Error:", ttsError);
          // Fallback to browser TTS
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

function filterMessageContent(content: string): {
  text: string;
  animationKey: string;
  memoryUpdate?: { category: string; content: string; importance: number };
  statsUpdate?: { bond?: number; happiness?: number };
  toolCalls?: Array<{ tool: string; args: Record<string, string> }>;
  todoAdds: Array<{ title: string; note?: string }>;
  choicePrompt: ChoicePrompt | null;
} {
  let text = content;
  let animationKey = "";
  let memoryUpdate = undefined;
  let statsUpdate = undefined;
  let toolCalls: Array<{ tool: string; args: Record<string, string> }> = [];
  const todoAdds: Array<{ title: string; note?: string }> = [];
  let choicePrompt: ChoicePrompt | null = null;

  // 1. Globally strip and extract Memory Updates
  const memoryRegex = /\[MEMORY_UPDATE:\s*([^|]+)\|([^|]+)\|\s*(\d+)\s*\]/gi;
  let m;
  while ((m = memoryRegex.exec(text)) !== null) {
    const category = m[1].trim().toLowerCase();
    const validCategories = ["fact", "preference", "event", "relationship"];
    memoryUpdate = {
      category: validCategories.includes(category) ? category : "fact",
      content: m[2].trim(),
      importance: parseInt(m[3], 10) || 5,
    };
  }
  text = text.replace(/\[MEMORY_UPDATE:.*?\]/gi, "").trim();

  // 2. Globally strip and extract Stats Updates
  const statsRegex = /\[STATS_UPDATE:?\s*\{(.*?)\}\]/gi;
  let s;
  while ((s = statsRegex.exec(text)) !== null) {
    try {
      const bondMatch = s[1].match(/bond:\s*([+-]?\d+)/i);
      const happyMatch = s[1].match(/happiness:\s*([+-]?\d+)/i);
      statsUpdate = {
        bond: bondMatch ? parseInt(bondMatch[1]) : 0,
        happiness: happyMatch ? parseInt(happyMatch[1]) : 0,
      };
    } catch {
      /* ignore */
    }
  }
  text = text.replace(/\[STATS_UPDATE:.*?\]/gi, "").trim();

  // 2.5 Extract Tool Calls: [TOOL_CALL: tool_name | arg1=value1, arg2=value2]
  const toolRegex = /\[TOOL_CALL:\s*(\w+)\s*\|(.*?)\]/gi;
  let t;
  while ((t = toolRegex.exec(text)) !== null) {
    const toolName = t[1].trim();
    const argsStr = t[2].trim();
    const args: Record<string, string> = {};

    // Parse simple key=value pairs
    const argPairs = argsStr.split(",").map((pair) => pair.trim());
    for (const pair of argPairs) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        args[key.trim()] = valueParts.join("=").trim();
      }
    }

    if (Object.keys(args).length > 0) {
      toolCalls.push({ tool: toolName, args });
    }
  }
  text = text.replace(/\[TOOL_CALL:.*?\]/gi, "").trim();

  const todoRegex = /\[TODO_ADD:\s*([^|\]]+?)(?:\|([^\]]*?))?\]/gi;
  let todoMatch;
  while ((todoMatch = todoRegex.exec(text)) !== null) {
    const title = todoMatch[1].trim();
    const note = todoMatch[2]?.trim();

    if (title) {
      todoAdds.push({
        title,
        note: note || undefined,
      });
    }
  }
  text = text.replace(/\[TODO_ADD:.*?\]/gi, "").trim();

  const choiceRegex = /\[CHOICE:\s*([^\]|]+)((?:\|[^\]]+)+)\]/i;
  const choiceMatch = text.match(choiceRegex);
  if (choiceMatch) {
    const prompt = choiceMatch[1].trim();
    const options = choiceMatch[2]
      .split("|")
      .map((option) => option.trim())
      .filter(Boolean);

    if (prompt && options.length > 0) {
      choicePrompt = { prompt, options };
    }
  }
  text = text.replace(/\[CHOICE:.*?\]/gi, "").trim();

  // 3. Clean up generic internal tags
  text = text
    .replace(/\[(STATS_UPDATE|MEMORY_UPDATE|TODO_ADD|CHOICE).*?\]/gi, "")
    .trim();

  // 4. Extract and Strip leading Animation tags with fuzzy matching
  let hasLeadingTag = true;
  text = text.trimStart();

  while (hasLeadingTag) {
    // Look for tags at the very start of the string
    const tagMatch = text.match(/^\[([A-Za-z0-9\s_]+)\]/);
    if (tagMatch) {
      const fullTag = tagMatch[0];
      const tagContent = tagMatch[1].trim().toLowerCase();

      // Try to map to a real animation key if we don't have one yet
      if (!animationKey) {
        for (const key of ANIMATION_KEYS) {
          const lowerKey = key.toLowerCase();
          if (
            tagContent === lowerKey ||
            tagContent === lowerKey + "ing" ||
            tagContent + "ing" === lowerKey ||
            (tagContent === "greeting" && lowerKey === "wave") ||
            (tagContent === "thinking" && lowerKey === "think")
          ) {
            animationKey = key;
            break;
          }
        }
      }

      // Always remove the tag from the displayed text
      text = text.slice(fullTag.length).trimStart();
    } else {
      hasLeadingTag = false;
    }
  }

  return {
    text,
    animationKey,
    memoryUpdate,
    statsUpdate,
    toolCalls,
    todoAdds,
    choicePrompt,
  };
}

type ChoicePrompt = {
  prompt: string;
  options: string[];
};

function mergeTodoItems(
  existingTodoItems: TodoItem[],
  nextTodoAdds: Array<{ title: string; note?: string }>,
) {
  const normalizedIndex = new Map(
    existingTodoItems.map((todoItem) => [
      normalizeTodoKey(todoItem.title),
      todoItem,
    ]),
  );
  const mergedTodoItems = [...existingTodoItems];

  for (const todoAdd of nextTodoAdds) {
    const normalizedTitle = normalizeTodoKey(todoAdd.title);
    const existingTodo = normalizedIndex.get(normalizedTitle);

    if (existingTodo) {
      existingTodo.note = todoAdd.note || existingTodo.note;
      existingTodo.completed = false;
      existingTodo.updatedAt = Date.now();
      continue;
    }

    const nextTodoItem: TodoItem = {
      id: crypto.randomUUID(),
      title: todoAdd.title,
      note: todoAdd.note,
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    normalizedIndex.set(normalizedTitle, nextTodoItem);
    mergedTodoItems.push(nextTodoItem);
  }

  return mergedTodoItems;
}

function normalizeTodoKey(value: string) {
  return value.trim().toLowerCase();
}

function buildMemoryContext(
  memories: Memory[],
  stats: MemoryStats,
  t: Translations,
): string {
  if (memories.length === 0) {
    return t.no_memories_yet;
  }

  // Group memories by category
  const byCategory: Record<string, Memory[]> = {};
  const shortTermMemories = memories.filter(
    (memory) => memory.retention === "short_term",
  );
  const longTermMemories = memories.filter(
    (memory) => memory.retention !== "short_term",
  );
  for (const memory of longTermMemories) {
    if (!byCategory[memory.category]) {
      byCategory[memory.category] = [];
    }
    byCategory[memory.category].push(memory);
  }

  const lines: string[] = [];

  // Add relationship context
  let relationshipLevel = t.strangers;
  if (stats.bondLevel >= 80) relationshipLevel = t.best_friends;
  else if (stats.bondLevel >= 60) relationshipLevel = t.close_friends;
  else if (stats.bondLevel >= 40) relationshipLevel = t.friends;
  else if (stats.bondLevel >= 20) relationshipLevel = t.acquaintances;

  lines.push(
    `${t.relationship}: We are ${relationshipLevel}. ${t.bond_level}: ${stats.bondLevel}/100, ${t.happiness}: ${stats.happiness}/100`,
  );
  lines.push(
    `${t.current_mood}: ${getMoodLabel(stats.mood.primary, t)}. ${t.response_style}: ${getResponseStyleLabel(stats.mood.responseStyle, t)}. ${t.user_tone}: ${getUserToneLabel(stats.mood.userTone, t)}. ${t.social_battery}: ${stats.mood.socialBattery}/100.`,
  );
  lines.push(stats.mood.summary);
  lines.push("");

  if (shortTermMemories.length > 0) {
    lines.push("Recent short-term context:");
    for (const memory of shortTermMemories.slice(0, 4)) {
      lines.push(`  - ${memory.content}`);
    }
    lines.push("");
  }

  // Add memories by category
  const categoryOrder: ("fact" | "preference" | "relationship" | "event")[] = [
    "fact",
    "preference",
    "relationship",
    "event",
  ];
  for (const category of categoryOrder) {
    const categoryMemories = byCategory[category];
    if (categoryMemories?.length) {
      const categoryLabel =
        category === "fact"
          ? t.fact
          : category === "preference"
            ? t.preference
            : category === "relationship"
              ? t.relationship
              : t.event;

      lines.push(`${categoryLabel}:`);
      for (const memory of categoryMemories.slice(0, 5)) {
        lines.push(`  - ${memory.content}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function getMoodLabel(mood: MemoryStats["mood"]["primary"], t: Translations) {
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

function getResponseStyleLabel(
  style: MemoryStats["mood"]["responseStyle"],
  t: Translations,
) {
  switch (style) {
    case "gentle":
      return t.response_gentle;
    case "energetic":
      return t.response_energetic;
    case "balanced":
    default:
      return t.response_balanced;
  }
}

function getUserToneLabel(
  tone: MemoryStats["mood"]["userTone"],
  t: Translations,
) {
  switch (tone) {
    case "positive":
      return t.tone_positive;
    case "affectionate":
      return t.tone_affectionate;
    case "curious":
      return t.tone_curious;
    case "distressed":
      return t.tone_distressed;
    case "frustrated":
      return t.tone_frustrated;
    case "neutral":
    default:
      return t.tone_neutral;
  }
}
