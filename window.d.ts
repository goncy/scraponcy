declare global {
  interface Window {
    ai: {
      createTextSession: () => Promise<void>;
      canCreateTextSession: () => Promise<void>;
    };
  }
}

export {};
