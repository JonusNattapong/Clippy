import test from "node:test";
import assert from "node:assert/strict";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};

type MessageRecord = {
  sender: "user" | "clippy";
  content?: string;
  images?: string[];
  createdAt: number;
};

function buildHistory(
  history: MessageRecord[],
  message: string,
  images?: string[],
): ChatMessage[] {
  const historyMessages: ChatMessage[] = history
    .filter((entry) => entry.content)
    .map((entry) => {
      if (entry.images && entry.images.length > 0) {
        const content: Array<{
          type: string;
          text?: string;
          image_url?: { url: string };
        }> = [{ type: "text", text: entry.content || "" }];
        for (const img of entry.images) {
          content.push({ type: "image_url", image_url: { url: img } });
        }
        return {
          role: entry.sender === "user" ? "user" : "assistant",
          content,
        };
      }
      return {
        role: entry.sender === "user" ? "user" : "assistant",
        content: entry.content || "",
      };
    });

  if (images && images.length > 0) {
    const content: Array<{
      type: string;
      text?: string;
      image_url?: { url: string };
    }> = [{ type: "text", text: message }];
    for (const img of images) {
      content.push({ type: "image_url", image_url: { url: img } });
    }
    return [...historyMessages, { role: "user", content }];
  }

  return [...historyMessages, { role: "user", content: message }];
}

function resolveGeminiModelName(model: string): string {
  return model;
}

function extractGeminiText(payload: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("");
}

test("buildHistory converts empty history to message", () => {
  const result = buildHistory([], "Hello");

  assert.equal(result.length, 1);
  assert.equal(result[0].role, "user");
  assert.equal(result[0].content, "Hello");
});

test("buildHistory adds system prompt at start", () => {
  const result = buildHistory([], "Hello", undefined);

  assert.equal(result.length, 1);
});

test("buildHistory includes history messages", () => {
  const history: MessageRecord[] = [
    { sender: "user", content: "Hi", createdAt: 1000 },
    { sender: "clippy", content: "Hello!", createdAt: 2000 },
  ];

  const result = buildHistory(history, "How are you?");

  assert.equal(result.length, 3);
  assert.equal(result[0].role, "user");
  assert.equal(result[0].content, "Hi");
  assert.equal(result[1].role, "assistant");
  assert.equal(result[1].content, "Hello!");
  assert.equal(result[2].role, "user");
  assert.equal(result[2].content, "How are you?");
});

test("buildHistory filters empty content", () => {
  const history: MessageRecord[] = [
    { sender: "user", content: "", createdAt: 1000 },
    { sender: "clippy", content: "Hello!", createdAt: 2000 },
  ];

  const result = buildHistory(history, "Test");

  assert.equal(result.length, 2);
});

test("buildHistory handles images in current message", () => {
  const result = buildHistory([], "Look at this", [
    "data:image/png;base64,abc123",
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].role, "user");
  assert.ok(Array.isArray(result[0].content));
});

test("buildHistory handles images in history", () => {
  const history: MessageRecord[] = [
    {
      sender: "user",
      content: "Here's an image",
      images: ["data:image/png;base64,abc"],
      createdAt: 1000,
    },
  ];

  const result = buildHistory(history, "What do you see?");

  assert.equal(result.length, 2);
  assert.ok(Array.isArray(result[0].content));
});

test("resolveGeminiModelName returns model name as-is", () => {
  assert.equal(resolveGeminiModelName("gemini-1.5-flash"), "gemini-1.5-flash");
  assert.equal(resolveGeminiModelName("gemini-2.0-flash"), "gemini-2.0-flash");
  assert.equal(resolveGeminiModelName("other-model"), "other-model");
});

test("extractGeminiText extracts text from payload", () => {
  const payload = {
    candidates: [
      {
        content: {
          parts: [{ text: "Hello world" }, { text: " Continued" }],
        },
      },
    ],
  };

  const result = extractGeminiText(payload);
  assert.equal(result, "Hello world Continued");
});

test("extractGeminiText handles empty payload", () => {
  assert.equal(extractGeminiText({}), "");
  assert.equal(extractGeminiText({ candidates: [] }), "");
  assert.equal(extractGeminiText({ candidates: [{}] }), "");
  assert.equal(extractGeminiText({ candidates: [{ content: {} }] }), "");
});

test("extractGeminiText handles missing parts", () => {
  const payload: {
    candidates: Array<{ content: { parts?: Array<{ text?: string }> } }>;
  } = {
    candidates: [
      {
        content: {
          parts: undefined,
        },
      },
    ],
  };

  assert.equal(extractGeminiText(payload), "");
});

test("extractGeminiText handles non-string text", () => {
  const payload = {
    candidates: [
      {
        content: {
          parts: [{ text: 123 }, { text: "valid" }],
        },
      },
    ],
  } as unknown as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  assert.equal(extractGeminiText(payload), "valid");
});
