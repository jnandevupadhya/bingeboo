export {};

declare global {
  interface Window {
    electron?: {
      resize: (width: number, height: number) => void;
      close: () => void;
      minimize: () => void;
      exitDiscordFullscreen: () => void;
      forceResize: () => void;
    };
  }
}
