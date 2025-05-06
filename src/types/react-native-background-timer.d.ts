declare module 'react-native-background-timer' {
  export function start(delay?: number): void;
  export function stop(): void;
  export function runBackgroundTimer(callback: () => void, delay: number): void;
  export function stopBackgroundTimer(): void;
  export function setTimeout(callback: (...args: any[]) => void, timeout: number, ...args: any[]): number;
  export function clearTimeout(timeoutId: number): void;
  export function setInterval(callback: (...args: any[]) => void, timeout: number, ...args: any[]): number;
  export function clearInterval(intervalId: number): void;
  export default {
    start,
    stop,
    runBackgroundTimer,
    stopBackgroundTimer,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
  };
}
