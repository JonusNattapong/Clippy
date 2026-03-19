import { ANIMATION_KEYS } from "../clippy-animation-helpers";
import { TodoItem } from "../../sharedState";
import { Translations } from "../i18n";
import {
  getMoodLabel,
  getResponseStyleLabel,
  getUserToneLabel,
} from "./mood-labels";

export type ChoiceStep = {
  prompt: string;
  options: string[];
  stepIndex?: number;
  totalSteps?: number;
};

export type ChoiceFlow = {
  steps: ChoiceStep[];
};

export type FilteredContent = {
  text: string;
  animationKey: string;
  memoryUpdate?: { category: string; content: string; importance: number };
  statsUpdate?: { bond?: number; happiness?: number };
  notifyTelegram?: { reason: string; message: string };
  toolCalls?: Array<{ tool: string; args: Record<string, string> }>;
  todoAdds: Array<{ title: string; note?: string }>;
  choiceFlow: ChoiceFlow | null;
};

function parseChoiceFlow(content: string): ChoiceFlow | null {
  const choiceRegex = /\[CHOICE:\s*([^\]]+)\]/gi;
  const steps: ChoiceStep[] = [];

  for (const match of content.matchAll(choiceRegex)) {
    const parts = match[1]
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length < 2) {
      continue;
    }

    let stepIndex: number | undefined;
    let totalSteps: number | undefined;
    let promptIndex = 0;
    const maybeStepToken = parts[0].match(/^(\d+)\s*\/\s*(\d+)$/);

    if (maybeStepToken) {
      stepIndex = Math.max(parseInt(maybeStepToken[1], 10) - 1, 0);
      totalSteps = Math.max(parseInt(maybeStepToken[2], 10), 1);
      promptIndex = 1;
    }

    const prompt = parts[promptIndex]?.trim();
    const options = parts.slice(promptIndex + 1).filter(Boolean);

    if (!prompt || options.length === 0) {
      continue;
    }

    steps.push({
      prompt,
      options,
      stepIndex,
      totalSteps,
    });
  }

  if (steps.length === 0) {
    return null;
  }

  const hasExplicitOrder = steps.some((step) => step.stepIndex !== undefined);
  const sortedSteps = hasExplicitOrder
    ? [...steps].sort(
        (left, right) =>
          (left.stepIndex ?? Number.MAX_SAFE_INTEGER) -
          (right.stepIndex ?? Number.MAX_SAFE_INTEGER),
      )
    : steps;

  return { steps: sortedSteps };
}

/**
 * Processes the raw AI response content to extract structured data and clean the text for display.
 * This function is pure and does not have any side effects.
 */
export function filterMessageContent(
  content: string,
  settings: { todoItems: TodoItem[] | undefined },
  t: Translations,
): FilteredContent {
  let text: string = content;
  let animationKey: string = "";
  let memoryUpdate: FilteredContent["memoryUpdate"] | undefined;
  let statsUpdate: FilteredContent["statsUpdate"] | undefined;
  let notifyTelegram: FilteredContent["notifyTelegram"] | undefined;
  let toolCalls: FilteredContent["toolCalls"] = [];
  const todoAdds: Array<{ title: string; note?: string }> = [];
  let choiceFlow: ChoiceFlow | null = null;

  // 1. Globally strip and extract Memory Updates
  const memoryRegex = /\[MEMORY_UPDATE:\s*([^|]+)\|([^|]+)\|\s*(\d+)\s*\]/gi;
  for (const match of text.matchAll(memoryRegex)) {
    const category = match[1].trim().toLowerCase();
    const validCategories = ["fact", "preference", "event", "relationship"];
    memoryUpdate = {
      category: validCategories.includes(category) ? category : "fact",
      content: match[2].trim(),
      importance: parseInt(match[3], 10) || 5,
    };
  }
  text = text.replace(memoryRegex, "").trim();

  // 2. Globally strip and extract Stats Updates
  const statsRegex = /\[STATS_UPDATE:?\s*\{(.*?)\}\]/gi;
  for (const match of text.matchAll(statsRegex)) {
    try {
      const bondMatch = match[1].match(/bond:\s*([+-]?\d+)/i);
      const happyMatch = match[1].match(/happiness:\s*([+-]?\d+)/i);
      statsUpdate = {
        bond: bondMatch ? parseInt(bondMatch[1]) : 0,
        happiness: happyMatch ? parseInt(happyMatch[1]) : 0,
      };
    } catch {
      /* ignore */
    }
  }
  text = text.replace(statsRegex, "").trim();

  const notifyRegex = /\[NOTIFY_TELEGRAM:\s*([^|]+)\|([\s\S]*?)\]/gi;
  for (const match of text.matchAll(notifyRegex)) {
    const reason = match[1].trim();
    const message = match[2].trim();
    if (reason && message) {
      notifyTelegram = { reason, message };
    }
  }
  text = text.replace(notifyRegex, "").trim();

  // 2.5 Extract Tool Calls: [TOOL_CALL: tool_name | arg1=value1, arg2=value2]
  const toolRegex = /\[TOOL_CALL:\s*(\w+)\s*\|(.*?)\]/gi;
  for (const match of text.matchAll(toolRegex)) {
    const toolName = match[1].trim();
    const argsStr = match[2].trim();
    const args: Record<string, string> = {};

    const argPairs = argsStr.split(",").map((pair) => pair.trim());
    for (const pair of argPairs) {
      const [key, ...valueParts] = pair.split("=");
      if (key && valueParts.length > 0) {
        args[key.trim()] = valueParts.join("=").trim();
      }
    }

    if (!argsStr || Object.keys(args).length > 0) {
      toolCalls.push({ tool: toolName, args });
    }
  }
  text = text.replace(toolRegex, "").trim();

  const todoRegex = /\[TODO_ADD:\s*([^|\]]+?)(?:\|([^\]]*?))?\]/gi;
  for (const match of text.matchAll(todoRegex)) {
    const title = match[1].trim();
    const note = match[2]?.trim();

    if (title) {
      todoAdds.push({
        title,
        note: note || undefined,
      });
    }
  }
  text = text.replace(todoRegex, "").trim();

  choiceFlow = parseChoiceFlow(text);
  text = text.replace(/\[CHOICE:\s*[^\]]+\]/gi, "").trim();

  // 3. Clean up generic internal tags
  text = text
    .replace(
      /\[(STATS_UPDATE|MEMORY_UPDATE|TODO_ADD|CHOICE|NOTIFY_TELEGRAM).*?\]/gi,
      "",
    )
    .trim();

  // 4. Extract and Strip leading Animation tags with fuzzy matching
  let hasLeadingTag = true;
  text = text.trimStart();

  while (hasLeadingTag) {
    const tagMatch = text.match(/^\[([A-Za-z0-9\s_]+)\]/);
    if (tagMatch) {
      const fullTag = tagMatch[0];
      const tagContent = tagMatch[1].trim().toLowerCase();

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
    notifyTelegram,
    toolCalls,
    todoAdds,
    choiceFlow,
  };
}

/**
 * Merges new todo items with existing ones, avoiding duplicates by normalized title.
 */
export function mergeTodoItems(
  existingTodoItems: TodoItem[] | undefined,
  nextTodoAdds: Array<{ title: string; note?: string }>,
): TodoItem[] {
  const existing: TodoItem[] = existingTodoItems ?? [];
  const normalizedIndex: Map<string, TodoItem> = new Map(
    existing.map((todoItem) => [normalizeTodoKey(todoItem.title), todoItem]),
  );
  const mergedTodoItems: TodoItem[] = [...existing];

  for (const todoAdd of nextTodoAdds) {
    const normalizedTitle: string = normalizeTodoKey(todoAdd.title);
    const existingTodo: TodoItem | undefined =
      normalizedIndex.get(normalizedTitle);

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

/**
 * Normalizes a string for use as a todo key (trim and lowercase).
 */
export function normalizeTodoKey(value: string): string {
  return value.trim().toLowerCase();
}
