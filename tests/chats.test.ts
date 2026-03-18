import test from "node:test";
import assert from "node:assert/strict";

interface ChatRecord {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

interface MessageRecord {
  id: string;
  sender: "user" | "clippy";
  content?: string;
  images?: string[];
  createdAt: number;
}

interface ChatWithMessages {
  chat: ChatRecord;
  messages: MessageRecord[];
}

function validateChatRecord(record: unknown): record is ChatRecord {
  if (typeof record !== "object" || record === null) return false;
  const r = record as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.title === "string" &&
    typeof r.createdAt === "number" &&
    typeof r.updatedAt === "number"
  );
}

function validateMessageRecord(record: unknown): record is MessageRecord {
  if (typeof record !== "object" || record === null) return false;
  const r = record as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    (r.sender === "user" || r.sender === "clippy") &&
    typeof r.createdAt === "number"
  );
}

function validateChatWithMessages(data: unknown): data is ChatWithMessages {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    validateChatRecord(d.chat) &&
    Array.isArray(d.messages) &&
    d.messages.every(validateMessageRecord)
  );
}

function mergeChats(
  existing: Record<string, ChatRecord>,
  imported: ChatWithMessages[],
): Record<string, ChatRecord> {
  const result = { ...existing };

  for (const chat of imported) {
    if (!chat.chat?.id) continue;

    const existingChat = result[chat.chat.id];
    if (!existingChat || chat.chat.updatedAt > existingChat.updatedAt) {
      result[chat.chat.id] = chat.chat;
    }
  }

  return result;
}

function filterChatsByDate(
  chats: Record<string, ChatRecord>,
  afterTimestamp: number,
): ChatRecord[] {
  return Object.values(chats).filter(
    (chat) => chat.createdAt >= afterTimestamp,
  );
}

function sortChatsByUpdatedAt(
  chats: Record<string, ChatRecord>,
  descending: boolean = true,
): ChatRecord[] {
  const chatList = Object.values(chats);
  return chatList.sort((a, b) =>
    descending ? b.updatedAt - a.updatedAt : a.updatedAt - b.updatedAt,
  );
}

test("validateChatRecord returns true for valid record", () => {
  const record = {
    id: "chat-123",
    title: "Test Chat",
    createdAt: 1000,
    updatedAt: 2000,
  };

  assert.equal(validateChatRecord(record), true);
});

test("validateChatRecord returns false for invalid record", () => {
  assert.equal(validateChatRecord(null), false);
  assert.equal(validateChatRecord({}), false);
  assert.equal(validateChatRecord({ id: "123" }), false);
  assert.equal(validateChatRecord({ id: "123", title: "Test" }), false);
});

test("validateMessageRecord returns true for valid record", () => {
  const record = {
    id: "msg-123",
    sender: "user" as const,
    content: "Hello",
    createdAt: 1000,
  };

  assert.equal(validateMessageRecord(record), true);
});

test("validateMessageRecord accepts clippy sender", () => {
  const record = {
    id: "msg-123",
    sender: "clippy" as const,
    content: "Hi there",
    createdAt: 1000,
  };

  assert.equal(validateMessageRecord(record), true);
});

test("validateMessageRecord returns false for invalid sender", () => {
  const record = {
    id: "msg-123",
    sender: "bot",
    createdAt: 1000,
  };

  assert.equal(validateMessageRecord(record), false);
});

test("validateChatWithMessages returns true for valid data", () => {
  const data = {
    chat: {
      id: "chat-123",
      title: "Test",
      createdAt: 1000,
      updatedAt: 2000,
    },
    messages: [
      {
        id: "msg-1",
        sender: "user" as const,
        content: "Hi",
        createdAt: 1500,
      },
    ],
  };

  assert.equal(validateChatWithMessages(data), true);
});

test("validateChatWithMessages returns false for invalid data", () => {
  assert.equal(validateChatWithMessages(null), false);
  assert.equal(validateChatWithMessages({ chat: {} }), false);
  assert.equal(
    validateChatWithMessages({
      chat: { id: "1", title: "T", createdAt: 1, updatedAt: 1 },
    }),
    false,
  );
});

test("mergeChats updates existing chat with newer timestamp", () => {
  const existing: Record<string, ChatRecord> = {
    "chat-1": {
      id: "chat-1",
      title: "Old Chat",
      createdAt: 1000,
      updatedAt: 1000,
    },
  };

  const imported: ChatWithMessages[] = [
    {
      chat: {
        id: "chat-1",
        title: "New Chat",
        createdAt: 1000,
        updatedAt: 2000,
      },
      messages: [],
    },
  ];

  const result = mergeChats(existing, imported);

  assert.equal(result["chat-1"].title, "New Chat");
  assert.equal(result["chat-1"].updatedAt, 2000);
});

test("mergeChats keeps existing chat when newer", () => {
  const existing: Record<string, ChatRecord> = {
    "chat-1": {
      id: "chat-1",
      title: "Newer Chat",
      createdAt: 1000,
      updatedAt: 3000,
    },
  };

  const imported: ChatWithMessages[] = [
    {
      chat: {
        id: "chat-1",
        title: "Older Chat",
        createdAt: 1000,
        updatedAt: 2000,
      },
      messages: [],
    },
  ];

  const result = mergeChats(existing, imported);

  assert.equal(result["chat-1"].title, "Newer Chat");
});

test("mergeChats adds new chats from import", () => {
  const existing: Record<string, ChatRecord> = {};

  const imported: ChatWithMessages[] = [
    {
      chat: {
        id: "chat-new",
        title: "New Chat",
        createdAt: 1000,
        updatedAt: 1000,
      },
      messages: [],
    },
  ];

  const result = mergeChats(existing, imported);

  assert.ok(result["chat-new"]);
  assert.equal(result["chat-new"].title, "New Chat");
});

test("filterChatsByDate returns chats after timestamp", () => {
  const chats: Record<string, ChatRecord> = {
    c1: { id: "c1", title: "Chat 1", createdAt: 1000, updatedAt: 1000 },
    c2: { id: "c2", title: "Chat 2", createdAt: 2000, updatedAt: 2000 },
    c3: { id: "c3", title: "Chat 3", createdAt: 3000, updatedAt: 3000 },
  };

  const result = filterChatsByDate(chats, 2000);

  assert.equal(result.length, 2);
  assert.ok(result.some((c) => c.id === "c2"));
  assert.ok(result.some((c) => c.id === "c3"));
});

test("filterChatsByDate returns empty for future timestamp", () => {
  const chats: Record<string, ChatRecord> = {
    c1: { id: "c1", title: "Chat 1", createdAt: 1000, updatedAt: 1000 },
  };

  const result = filterChatsByDate(chats, 10000);

  assert.equal(result.length, 0);
});

test("sortChatsByUpdatedAt sorts descending by default", () => {
  const chats: Record<string, ChatRecord> = {
    c1: { id: "c1", title: "Chat 1", createdAt: 1000, updatedAt: 1000 },
    c2: { id: "c2", title: "Chat 2", createdAt: 2000, updatedAt: 2000 },
    c3: { id: "c3", title: "Chat 3", createdAt: 3000, updatedAt: 3000 },
  };

  const result = sortChatsByUpdatedAt(chats);

  assert.equal(result[0].id, "c3");
  assert.equal(result[1].id, "c2");
  assert.equal(result[2].id, "c1");
});

test("sortChatsByUpdatedAt sorts ascending when specified", () => {
  const chats: Record<string, ChatRecord> = {
    c1: { id: "c1", title: "Chat 1", createdAt: 1000, updatedAt: 1000 },
    c2: { id: "c2", title: "Chat 2", createdAt: 2000, updatedAt: 2000 },
  };

  const result = sortChatsByUpdatedAt(chats, false);

  assert.equal(result[0].id, "c1");
  assert.equal(result[1].id, "c2");
});
