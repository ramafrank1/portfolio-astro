// Provider-agnostic event tracking. Sends to Umami if its script is loaded (PUBLIC_UMAMI_WEBSITE_ID),
// and to GA4 if someone adds gtag later. Does nothing otherwise. Never send personal data here.
type Props = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: Props) => void };
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(name: string, props: Props = {}) {
  try {
    window.umami?.track(name, props);
    window.gtag?.('event', name, props);
  } catch {
    /* analytics must never break the page */
  }
  if (import.meta.env.DEV) console.debug('[track]', name, props);
}
