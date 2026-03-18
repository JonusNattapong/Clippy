import { ApiProvider } from "../../sharedState";
import { MessageRecord } from "../../types/interfaces";
import { clippyApi } from "../clippyApi";

export type StreamChatOptions = {
  provider: ApiProvider;
  model: string;
  systemPrompt: string;
  message: string;
  images?: string[];
  history: MessageRecord[];
  temperature?: number;
  topK?: number;
  signal?: AbortSignal;
};

type QueueItem =
  | { type: "chunk"; value: string }
  | { type: "end" }
  | { type: "error"; error: Error };

export async function* streamChatCompletion(options: StreamChatOptions) {
  const requestId = crypto.randomUUID();
  const queue: QueueItem[] = [];
  let resolver: (() => void) | null = null;
  let isFinished = false;

  const flush = () => {
    resolver?.();
    resolver = null;
  };

  const onChunk = (payload: { requestId: string; chunk: string }) => {
    if (payload.requestId !== requestId) {
      return;
    }

    queue.push({ type: "chunk", value: payload.chunk });
    flush();
  };

  const onEnd = (payload: { requestId: string }) => {
    if (payload.requestId !== requestId) {
      return;
    }

    isFinished = true;
    queue.push({ type: "end" });
    flush();
  };

  const onError = (payload: { requestId: string; error: string }) => {
    if (payload.requestId !== requestId) {
      return;
    }

    isFinished = true;
    queue.push({ type: "error", error: new Error(payload.error) });
    flush();
  };

  const cleanup = () => {
    clippyApi.offChatStreamChunk();
    clippyApi.offChatStreamEnd();
    clippyApi.offChatStreamError();
  };

  clippyApi.offChatStreamChunk();
  clippyApi.offChatStreamEnd();
  clippyApi.offChatStreamError();
  clippyApi.onChatStreamChunk(onChunk);
  clippyApi.onChatStreamEnd(onEnd);
  clippyApi.onChatStreamError(onError);

  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => {
        void clippyApi.abortChatStream(requestId);
      },
      { once: true },
    );
  }

  try {
    await clippyApi.startChatStream({
      requestId,
      provider: options.provider,
      model: options.model,
      systemPrompt: options.systemPrompt,
      message: options.message,
      images: options.images,
      history: options.history,
      temperature: options.temperature,
      topK: options.topK,
    });

    while (!isFinished || queue.length > 0) {
      if (queue.length === 0) {
        await new Promise<void>((resolve) => {
          resolver = resolve;
        });
      }

      const item = queue.shift();
      if (!item) {
        continue;
      }

      if (item.type === "chunk") {
        yield item.value;
      } else if (item.type === "error") {
        throw item.error;
      } else if (item.type === "end") {
        return;
      }
    }
  } finally {
    cleanup();
  }
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  options?: { provider?: ApiProvider; model?: string },
): Promise<string> {
  return clippyApi.transcribeAudio({
    audioBase64,
    mimeType,
    provider: options?.provider,
    model: options?.model,
  });
}
