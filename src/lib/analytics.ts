export const trackEvent = (event: string, data?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, data);
  }
  console.log(`[Analytics] ${event}`, data);
};
