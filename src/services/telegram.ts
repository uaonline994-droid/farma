import { TelegramUser } from "../types";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: TelegramUser;
          query_id?: string;
          auth_date?: string;
          hash?: string;
          start_param?: string;
        };
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme?: "light" | "dark";
        isExpanded?: boolean;
        viewportHeight?: number;
        viewportStableHeight?: number;
        headerColor?: string;
        backgroundColor?: string;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        BackButton?: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (cb: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
        };
      };
    };
  }
}

export function initTelegramApp() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      if (window.Telegram.WebApp.setHeaderColor) {
        window.Telegram.WebApp.setHeaderColor("#244828");
      }
      if (window.Telegram.WebApp.setBackgroundColor) {
        window.Telegram.WebApp.setBackgroundColor("#1e3b21");
      }
    } catch (e) {
      console.warn("Telegram WebApp initialization notice:", e);
    }
  }
}

export function getTelegramInitData(): string {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData || "";
  }
  return "";
}

export function getTelegramUser(): TelegramUser | null {
  if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user;
  }
  return null;
}

export function isTelegramEnv(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Telegram?.WebApp?.initData && window.Telegram.WebApp.initData.length > 0);
}

export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") {
  try {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      const haptic = window.Telegram.WebApp.HapticFeedback;
      if (type === "success" || type === "warning" || type === "error") {
        haptic.notificationOccurred(type);
      } else {
        haptic.impactOccurred(type);
      }
    }
  } catch {
    // Ignore if not supported in current environment
  }
}
