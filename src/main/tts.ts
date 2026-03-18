import { app } from "electron";
import path from "path";
import fs from "fs";
import { EdgeTTS } from "node-edge-tts";

export interface TtsOptions {
  text: string;
  voice?: string;
  rate?: string;
  volume?: string;
  pitch?: string;
  outputFormat?: string;
}

export interface TtsVoice {
  name: string;
  shortName: string;
  gender: string;
  locale: string;
}

const DEFAULT_VOICE = "en-US-MichelleNeural";
const DEFAULT_RATE = "+0%";
const DEFAULT_VOLUME = "+0%";
const DEFAULT_PITCH = "+0Hz";
const DEFAULT_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

const THAI_VOICE = "th-TH-PremwadeeNeural";

const VOICE_MAP: Record<string, string> = {
  "en-US": "en-US-MichelleNeural",
  "en-GB": "en-GB-SoniaNeural",
  "th-TH": THAI_VOICE,
  ja: "ja-JP-NanamiNeural",
  ko: "ko-KR-SunHiNeural",
  zh: "zh-CN-XiaoxiaoNeural",
};

export class TtsService {
  private tempPath: string;

  constructor() {
    this.tempPath = path.join(app.getPath("temp"), "clippy-tts");
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  private getVoiceForLocale(locale: string): string {
    return VOICE_MAP[locale] || DEFAULT_VOICE;
  }

  public async speak(options: TtsOptions): Promise<string> {
    const edgeTTS = new EdgeTTS();

    const voice = options.voice || DEFAULT_VOICE;
    const rate = options.rate || DEFAULT_RATE;
    const volume = options.volume || DEFAULT_VOLUME;
    const pitch = options.pitch || DEFAULT_PITCH;
    const outputFormat = options.outputFormat || DEFAULT_OUTPUT_FORMAT;

    await edgeTTS.setMetadata(voice, rate, volume, pitch, outputFormat);

    const outputFile = path.join(
      this.tempPath,
      `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`,
    );

    await edgeTTS.synthesize(options.text, outputFile);

    return outputFile;
  }

  public async speakThai(text: string): Promise<string> {
    return this.speak({
      text,
      voice: THAI_VOICE,
    });
  }

  public static async getAvailableVoices(): Promise<TtsVoice[]> {
    const voices = await EdgeTTS.getVoices();
    return voices.map(
      (v: {
        Name: string;
        ShortName: string;
        Gender: string;
        Locale: string;
      }) => ({
        name: v.Name,
        shortName: v.ShortName,
        gender: v.Gender,
        locale: v.Locale,
      }),
    );
  }

  public static getThaiVoices(): string[] {
    return ["th-TH-PremwadeeNeural", "th-TH-NachananNeural"];
  }

  public static getDefaultVoices(): string[] {
    return [
      "en-US-MichelleNeural",
      "en-US-GuyNeural",
      "en-GB-SoniaNeural",
      "en-GB-RyanNeural",
      "th-TH-PremwadeeNeural",
      "ja-JP-NanamiNeural",
      "ko-KR-SunHiNeural",
      "zh-CN-XiaoxiaoNeural",
    ];
  }

  public cleanupOldFiles(): void {
    try {
      const files = fs.readdirSync(this.tempPath);
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      for (const file of files) {
        const filePath = path.join(this.tempPath, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error("Error cleaning up TTS files:", error);
    }
  }
}

let _ttsService: TtsService | null = null;

export function getTtsService(): TtsService {
  if (!_ttsService) {
    _ttsService = new TtsService();
  }
  return _ttsService;
}
