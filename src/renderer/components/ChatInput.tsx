import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  Image,
  X,
  FileText,
  Paperclip,
} from "lucide-react";
import { useChat } from "../contexts/ChatContext";
import { useSharedState, useTranslation } from "../contexts/SharedStateContext";
import { transcribeAudio } from "../api/chat-provider";

interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export type ChatInputProps = {
  onSend: (
    message: string,
    images?: string[],
    files?: FileAttachment[],
  ) => void;
  onAbort: () => void;
};

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  content: string; // base64
}

export function ChatInput({ onSend, onAbort }: ChatInputProps) {
  const { status } = useChat();
  const t = useTranslation();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { isModelLoaded } = useChat();
  const { settings } = useSharedState();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [volume, setVolume] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isBusy = status === "thinking" || status === "responding";
  const hasApiKey = !!(settings.apiKey || settings.geminiApiKey || "").trim();
  const canUseApi = hasApiKey;
  const totalAttachments = images.length + files.length;

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
    if (trimmedMessage || images.length > 0 || files.length > 0) {
      onSend(trimmedMessage, images, files);
      setMessage("");
      setImages([]);
      setFiles([]);
    }
  }, [message, images, files, onSend]);

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

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const uploadedFiles = e.target.files;
      if (!uploadedFiles) return;

      const newFiles: FileAttachment[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.readAsDataURL(file);
        });

        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64,
        });
      }

      setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [],
  );

  const handleAudioFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const audioFiles = e.target.files;
      if (!audioFiles || audioFiles.length === 0) return;

      setIsTranscribing(true);
      setErrorMessage(null);

      try {
        const audioFile = audioFiles[0];
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.readAsDataURL(audioFile);
        });

        const provider =
          settings.apiProvider === "openai" ? "openai" : "gemini";
        const text = await transcribeAudio(base64, audioFile.type, {
          provider,
          model:
            provider === "gemini"
              ? settings.apiModel || "gemini-3-flash-preview"
              : undefined,
        });

        if (text && text.trim()) {
          setMessage(text.trim());
          if (text.trim().length > 1) {
            handleSend();
          }
        }
      } catch (err) {
        console.error("Audio file transcription error:", err);
        setErrorMessage(
          `Audio Error: ${err instanceof Error ? err.message : "Failed to transcribe"}`,
        );
      } finally {
        setIsTranscribing(false);
        if (audioInputRef.current) audioInputRef.current.value = "";
      }
    },
    [settings.apiProvider, settings.apiModel, handleSend],
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const newImages: string[] = [];
    const newFiles: FileAttachment[] = [];

    for (let i = 0; i < droppedFiles.length; i++) {
      const file = droppedFiles[i];

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.readAsDataURL(file);
        });
        newImages.push(base64);
      } else {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
          };
          reader.readAsDataURL(file);
        });
        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: base64,
        });
      }
    }

    setImages((prev) => [...prev, ...newImages].slice(0, 4));
    setFiles((prev) => [...prev, ...newFiles].slice(0, 4));
  }, []);

  // Screenshot capture
  const handleScreenshot = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      const dataUrl = canvas.toDataURL("image/png");
      setImages((prev) => [...prev, dataUrl].slice(0, 4));
    } catch (err) {
      console.error("Screenshot error:", err);
      setErrorMessage("Failed to capture screenshot");
    }
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
      : message || totalAttachments > 0
        ? ""
        : t.type_message;

  return (
    <div
      className={`chat-input-shell ${isDragging ? "dragging" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="chat-input-drop-overlay">
          <div className="chat-input-drop-message">
            Drop files here to attach
          </div>
        </div>
      )}
      {totalAttachments > 0 && (
        <div className="chat-input-images">
          {images.map((img, index) => (
            <div key={`img-${index}`} className="chat-input-image-preview">
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
          {files.map((file, index) => (
            <div key={`file-${index}`} className="chat-input-file-preview">
              <FileText size={20} />
              <span className="chat-input-file-name">{file.name}</span>
              <button
                type="button"
                className="chat-input-image-remove"
                onClick={() => removeFile(index)}
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
        {/* Image input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
        {/* File input for documents */}
        <input
          ref={audioInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.pptx"
          multiple
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        {/* Audio file input */}
        <input
          type="file"
          accept="audio/*"
          multiple
          onChange={handleAudioFileUpload}
          style={{ display: "none" }}
          id="audio-file-input"
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
        {/* File upload button */}
        <button
          className="chat-input-button"
          type="button"
          disabled={isBusy || isTranscribing || files.length >= 4}
          onClick={() => (audioInputRef.current as HTMLInputElement)?.click()}
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>
        {/* Screenshot button */}
        <button
          className="chat-input-button"
          type="button"
          disabled={isBusy || isTranscribing || images.length >= 4}
          onClick={handleScreenshot}
          title="Capture screenshot"
        >
          <Image size={18} />
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
