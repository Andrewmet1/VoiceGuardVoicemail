declare module 'react-native-call-detection' {
  export interface CallDetectorOptions {
    title?: string;
    text?: string;
    ios?: {
      appName?: string;
    };
  }

  export default class CallDetector {
    constructor(
      callback: (callState: string, phoneNumber: string) => void,
      errorCallback?: (error: Error) => void,
      options?: CallDetectorOptions
    );
    dispose(): void;
    startListener(): void;
    stopListener(): void;
  }
}
