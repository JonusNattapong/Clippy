import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Message } from "../components/Message";
import { clippyApi } from "../clippyApi";
import { WelcomeMessageContent } from "../components/WelcomeMessageContent";
import { ChatRecord, MessageRecord } from "../../types/interfaces";
import { useTranslation } from "./SharedStateContext";

type ClippyNamedStatus =
  | "welcome"
  | "idle"
  | "responding"
  | "thinking"
  | "goodbye";

export type ChatContextType = {
  messages: Message[];
  addMessage: (message: Message) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  animationKey: string;
  setAnimationKey: (animationKey: string) => void;
  status: ClippyNamedStatus;
  setStatus: (status: ClippyNamedStatus) => void;
  isModelLoaded: boolean;
  isChatWindowOpen: boolean;
  setIsChatWindowOpen: (isChatWindowOpen: boolean) => void;
  chatRecords: Record<string, ChatRecord>;
  currentChatRecord: ChatRecord;
  selectChat: (chatId: string) => void;
  startNewChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteAllChats: () => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

export function ChatProvider({ children }: { children: ReactNode }) {
  const t = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatRecord, setCurrentChatRecord] = useState<ChatRecord>({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preview: "",
  });
  const [chatRecords, setChatRecords] = useState<Record<string, ChatRecord>>(
    {},
  );
  const [animationKey, setAnimationKey] = useState<string>("");
  const [status, setStatus] = useState<ClippyNamedStatus>("welcome");
  const [isModelLoaded] = useState(true);
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);

  const hasInitialized = useRef(false);

  const addMessage = useCallback(async (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  const selectChat = useCallback(async (chatId: string) => {
    try {
      const chatWithMessages = await clippyApi.getChatWithMessages(chatId);
      if (chatWithMessages) {
        setMessages(chatWithMessages.messages);
        setCurrentChatRecord(chatWithMessages.chat);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const startNewChat = useCallback(async () => {
    const newChatRecord = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preview: "",
    };

    setCurrentChatRecord(newChatRecord);
    setChatRecords((prevChatRecords) => ({
      ...prevChatRecords,
      [newChatRecord.id]: newChatRecord,
    }));
    setMessages([
      {
        id: "initial-welcome",
        content: t.welcome_to_clippy,
        sender: "clippy",
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const deleteChat = useCallback(
    async (chatId: string) => {
      await clippyApi.deleteChat(chatId);
      setChatRecords((prevChatRecords) => {
        const newChatRecords = { ...prevChatRecords };
        delete newChatRecords[chatId];
        return newChatRecords;
      });
      if (currentChatRecord.id === chatId) {
        await startNewChat();
      }
    },
    [currentChatRecord.id, startNewChat],
  );

  const deleteAllChats = useCallback(async () => {
    await clippyApi.deleteAllChats();
    setChatRecords({});
    setMessages([]);
    await startNewChat();
  }, [startNewChat]);

  // Update the chat record in the database whenever messages change
  // DEBOUNCED or throttled is better, but this is simple
  useEffect(() => {
    if (messages.length === 0) return;

    const timeout = setTimeout(() => {
      const updatedChatRecord = {
        ...currentChatRecord,
        updatedAt: Date.now(),
        preview: currentChatRecord.preview || getPreviewFromMessages(messages),
      };
      const chatWithMessages = {
        chat: updatedChatRecord,
        messages: messages.map(messageRecordFromMessage),
      };
      clippyApi.writeChatWithMessages(chatWithMessages).catch((error) => {
        console.error(error);
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [messages, currentChatRecord]);

  // Initial Load
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    clippyApi.getChatRecords().then((records) => {
      setChatRecords(records);

      const recordArray = Object.values(records).sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );
      if (recordArray.length > 0) {
        // Load the most recent chat
        selectChat(recordArray[0].id).then(() => {
          // Clean up if the first message is duplicated (rare legacy issue)
          setMessages((prev) => {
            if (
              prev.length >= 2 &&
              prev[0].sender === "clippy" &&
              prev[1].sender === "clippy" &&
              prev[0].content === prev[1].content
            ) {
              return prev.slice(1);
            }
            return prev;
          });
        });
      } else {
        // New user or empty database
        startNewChat();
      }
    });

    const waterInterval = setInterval(
      () => {
        setMessages((prev) => {
          // Check if any water reminder was sent in the last 55 minutes
          const waterReminderCooldown = 55 * 60 * 1000; // 55 minutes
          const now = Date.now();
          const hasRecentWaterReminder = prev.some(
            (msg) =>
              msg.content?.includes("อย่าลืมดื่มน้ำ") &&
              now - msg.createdAt < waterReminderCooldown,
          );
          if (hasRecentWaterReminder) return prev;

          const waterMsg: Message = {
            id: crypto.randomUUID(),
            content:
              "[GetAttention] เพื่อนรัก! อย่าลืมดื่มน้ำสักนิดนะ ร่างกายจะได้สดชื่น 💧",
            sender: "clippy",
            createdAt: Date.now(),
          };
          setAnimationKey("GetAttention");
          return [...prev, waterMsg];
        });
      },
      1000 * 60 * 60,
    );

    return () => clearInterval(waterInterval);
  }, [selectChat, startNewChat]);

  useEffect(() => {
    clippyApi.offNewChat();
    clippyApi.onNewChat(async () => {
      await startNewChat();
    });
    return () => {
      clippyApi.offNewChat();
    };
  }, [startNewChat]);

  const value = {
    chatRecords,
    currentChatRecord,
    selectChat,
    deleteChat,
    deleteAllChats,
    startNewChat,
    messages,
    addMessage,
    setMessages,
    animationKey,
    setAnimationKey,
    status,
    setStatus,
    isModelLoaded,
    isChatWindowOpen,
    setIsChatWindowOpen,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

function messageRecordFromMessage(message: Message): MessageRecord {
  return {
    id: message.id,
    content: message.content,
    sender: message.sender,
    createdAt: message.createdAt,
    images: message.images,
  };
}

function getPreviewFromMessages(messages: Message[]): string {
  if (messages.length === 0) return "";
  const firstUserMessage = messages.find((m) => m.sender === "user");
  if (firstUserMessage) {
    return firstUserMessage.content.replace(/\n/g, " ").substring(0, 100);
  }
  return "New Chat";
}
