declare module "node-edge-tts" {
  export interface Voice {
    Name: string;
    ShortName: string;
    Gender: string;
    Locale: string;
    Language: string;
    FriendlyName: string;
    Status: string;
  }

  export interface EdgeTTSOptions {
    voice?: string;
    rate?: string;
    volume?: string;
    pitch?: string;
    outputFormat?: string;
  }

  export class EdgeTTS {
    constructor();

    setMetadata(
      voice: string,
      rate?: string,
      volume?: string,
      pitch?: string,
      outputFormat?: string,
    ): Promise<void>;

    synthesize(text: string, outputFile: string): Promise<void>;

    static getVoices(): Promise<Voice[]>;
  }
}
