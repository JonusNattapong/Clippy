import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Image, X } from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { transcribeAudio } from "../api/chat-provider";

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export type ChatInputProps = {
  onSend: (message: string, images?: string[]) => void;
  onAbort: () => void;
};

export function ChatInput({ onSend, onAbort }: ChatInputProps) {
  const { status } = useChat();
  const t = useTranslation();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const { isModelLoaded } = useChat();
  const { settings } = useSharedState();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isBusy = status === "thinking" || status === "responding";
  const hasApiKey = !!(settings.apiKey || settings.geminiApiKey || "").trim();
  const canUseApi = hasApiKey;

  // Audio Visualizer Logic
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number | null = null;

    if (isListening) {
      const startAudioAnalysis = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioContext = new (window.AudioContext ||
            (window as ExtendedWindow).webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          analyser.fftSize = 64;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let total = 0;
            for (let i = 0; i < bufferLength; i++) {
              total += dataArray[i];
            }
            const average = total / bufferLength;
            setVolume(average);
            animationFrameId = requestAnimationFrame(updateVolume);
          };
          updateVolume();

          // Setup MediaRecorder
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          mediaRecorder.onstop = async () => {
            if (chunksRef.current.length === 0) return;

            const audioBlob = new Blob(chunksRef.current, {
              type: "audio/webm",
            });
            if (audioBlob.size < 1000) {
              // Too small, probably silence or error
              setIsTranscribing(false);
              return;
            }

            setIsTranscribing(true);
            setErrorMessage(null);

            try {
              const audioBase64 = await blobToBase64(audioBlob);
              const provider =
                settings.apiProvider === "openai" ? "openai" : "gemini";
              const text = await transcribeAudio(audioBase64, audioBlob.type, {
                provider,
                model:
                  provider === "gemini"
                    ? settings.apiModel || "gemini-3-flash-preview"
                    : undefined,
              });

              if (text && text.trim()) {
                setMessage(text.trim());
                // Auto-send if it's a significant message
                if (text.trim().length > 1) {
                  onSend(text.trim());
                  setMessage("");
                }
              }
            } catch (err: unknown) {
              console.error("Transcription error:", err);
              const errorMessage =
                err instanceof Error ? err.message : "Failed to transcribe";
              setErrorMessage(`Speech Error: ${errorMessage}`);
            } finally {
              setIsTranscribing(false);
            }
          };

          mediaRecorder.start();
        } catch (err) {
          console.error("Audio capture error:", err);
          setErrorMessage("Microphone access denied.");
          setIsListening(false);
        }
      };
      startAudioAnalysis();
    } else {
      setVolume(0);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (audioContext) audioContext.close();
    };
  }, [
    isListening,
    onSend,
    settings.apiKey,
    settings.apiProvider,
    settings.geminiApiKey,
    settings.apiModel,
  ]);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage || images.length > 0) {
      onSend(trimmedMessage, images);
      setMessage("");
      setImages([]);
    }
  }, [message, images, onSend]);

  const handleAbort = useCallback(() => {
    setMessage("");
    onAbort();
  }, [onAbort]);

  const handleSendOrAbort = useCallback(() => {
    if (isBusy) {
      handleAbort();
    } else {
      handleSend();
    }
  }, [isBusy, handleSend, handleAbort]);

  const toggleListening = useCallback(() => {
    if (isTranscribing) return;
    setIsListening(!isListening);
  }, [isListening, isTranscribing]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      }

      setImages((prev) => [...prev, ...newImages].slice(0, 4));
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  useEffect(() => {
    if (
      isModelLoaded &&
      canUseApi &&
      textareaRef.current &&
      !isListening &&
      !isTranscribing
    ) {
      textareaRef.current.focus();
    }
  }, [canUseApi, isListening, isModelLoaded, isTranscribing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const trimmedMessage = message.trim();
      if (trimmedMessage || images.length > 0) {
        handleSend();
      }
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const placeholder = isBusy
    ? t.clippy_is_responding
    : isTranscribing
      ? t.clippy_is_listening
      : message || images.length > 0
        ? ""
        : t.type_message;

  return (
    <div className="chat-input-shell">
      {images.length > 0 && (
        <div className="chat-input-images">
          {images.map((img, index) => (
            <div key={index} className="chat-input-image-preview">
              <img src={img} alt={`Upload ${index + 1}`} />
              <button
                type="button"
                className="chat-input-image-remove"
                onClick={() => removeImage(index)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="chat-input-hint">
        {errorMessage
          ? `⚠️ ${errorMessage}`
          : isBusy
            ? t.clippy_is_responding
            : isTranscribing
              ? t.transcribing
              : isListening
                ? t.recording
                : canUseApi
                  ? `${t.enter_to_send} - ${t.shift_enter}`
                  : t.provide_api_key}
      </div>
      <div className="chat-input-row">
        <textarea
          rows={1}
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={!isModelLoaded || !canUseApi || isBusy || isTranscribing}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`chat-input-textarea ${isListening ? "voice-active" : ""} ${isTranscribing ? "transcribing" : ""}`}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        <button
          className="chat-input-button"
          type="button"
          disabled={isBusy || isTranscribing || images.length >= 4}
          onClick={() => fileInputRef.current?.click()}
          title="Add image"
        >
          <Image size={18} />
        </button>
        <button
          className={`chat-input-button voice-button ${isListening ? "listening" : ""} ${isTranscribing ? "loading" : ""}`}
          type="button"
          disabled={isBusy || isTranscribing}
          onClick={toggleListening}
          style={{
            position: "relative",
            overflow: "hidden",
            boxShadow: isListening
              ? `0 0 ${volume / 2}px ${volume / 4}px rgba(0, 255, 0, 0.5)`
              : "none",
            transform: isListening ? `scale(${1 + volume / 200})` : "scale(1)",
            transition: "transform 0.1s ease, box-shadow 0.1s ease",
          }}
        >
          {isTranscribing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isListening ? (
            <MicOff size={18} />
          ) : (
            <Mic size={18} />
          )}
        </button>
        <button
          className="chat-input-button"
          type="button"
          disabled={
            isBusy
              ? false
              : !isModelLoaded ||
                !canUseApi ||
                (!message.trim() && images.length === 0) ||
                isTranscribing
          }
          onClick={handleSendOrAbort}
        >
          {isBusy ? "Stop" : "Send"}
        </button>
      </div>
    </div>
  );
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}
