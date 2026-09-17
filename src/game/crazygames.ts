/**
 * CrazyGames SDK v3 Wrapper & Utility Service
 *
 * Designed to seamlessly bridge the game with the CrazyGames platform SDK
 * while safely falling back to local/standalone behavior when played outside CrazyGames.
 */

declare global {
  interface Window {
    CrazyGames?: {
      SDK?: {
        init: () => Promise<void>;
        ad?: {
          requestAd: (
            type: 'midgame' | 'rewarded',
            callbacks?: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: any) => void;
            }
          ) => void;
          hasAdblock?: () => Promise<boolean>;
        };
        game?: {
          gameplayStart: () => void;
          gameplayStop: () => void;
          happytime: () => void;
        };
        user?: {
          getUser: () => Promise<{ username?: string; id?: string; profilePictureUrl?: string } | null>;
          isUserAccountAvailable?: boolean;
        };
        data?: {
          getItem: (key: string) => Promise<string | null>;
          setItem: (key: string, value: string) => Promise<void>;
          removeItem: (key: string) => Promise<void>;
          clear: () => Promise<void>;
        };
      };
    };
  }
}

// Add global unhandledrejection guard to catch any external SDK rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason) {
      console.warn('[CrazyGames SDK] Prevented unhandled rejection:', event.reason);
      try {
        event.preventDefault();
      } catch (e) {
        // ignore
      }
    }
  });
}

class CrazyGamesService {
  private isAvailable: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<boolean> | null = null;
  private currentUser: { username?: string; id?: string } | null = null;

  /**
   * Checks whether the current host environment is appropriate to load the external CrazyGames SDK script.
   */
  private isCrazyGamesSupportedHost(): boolean {
    if (typeof window === 'undefined') return false;
    if (window.CrazyGames?.SDK) return true;

    const host = window.location.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.includes('crazygames') ||
      host.includes('gamedev') ||
      host.includes('crazygames-iframe')
    );
  }

  /**
   * Dynamically loads the CrazyGames SDK v3 script tag when in a supported host.
   */
  private loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        resolve(false);
        return;
      }

      if (window.CrazyGames?.SDK) {
        resolve(true);
        return;
      }

      if (!this.isCrazyGamesSupportedHost()) {
        console.log('[CrazyGames SDK] Non-CrazyGames host environment detected. Skipping script injection to prevent domain rejection.');
        resolve(false);
        return;
      }

      const existingScript = document.querySelector('script[src*="crazygames-sdk-v3.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = (err) => {
        console.warn('[CrazyGames SDK] Script load error or blocked by client. Continuing in fallback mode.', err);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Initializes the CrazyGames SDK v3 asynchronously.
   * Safe to call multiple times and guaranteed never to reject or throw.
   */
  public async init(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<boolean>((resolve) => {
      (async () => {
        try {
          const scriptLoaded = await this.loadScript();
          if (scriptLoaded && window.CrazyGames?.SDK?.init) {
            await window.CrazyGames.SDK.init().catch((err) => {
              console.warn('[CrazyGames SDK] SDK init rejected:', err);
            });

            if (window.CrazyGames?.SDK) {
              this.isAvailable = true;
              this.isInitialized = true;
              console.log('[CrazyGames SDK] Successfully initialized on CrazyGames platform.');
              
              try {
                await this.syncCloudSaveToLocal();
              } catch (syncErr) {
                console.warn('[CrazyGames SDK] Cloud save sync error ignored:', syncErr);
              }

              try {
                await this.fetchUser();
              } catch (userErr) {
                console.warn('[CrazyGames SDK] User fetch error ignored:', userErr);
              }

              resolve(true);
              return;
            }
          } else {
            console.log('[CrazyGames SDK] Running in standalone/preview mode (SDK script inactive). Fallbacks active.');
          }
        } catch (error) {
          console.warn('[CrazyGames SDK] Initialization caught exception:', error);
        }

        this.isAvailable = false;
        this.isInitialized = true;
        resolve(false);
      })();
    });

    return this.initPromise;
  }

  /**
   * Notify CrazyGames that active gameplay has started/resumed.
   */
  public gameplayStart(): void {
    if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStart) {
      try {
        window.CrazyGames.SDK.game.gameplayStart();
      } catch (e) {
        console.warn('[CrazyGames SDK] gameplayStart error:', e);
      }
    }
  }

  /**
   * Notify CrazyGames that gameplay has stopped/paused (e.g. menu, pause, level selection).
   */
  public gameplayStop(): void {
    if (this.isAvailable && window.CrazyGames?.SDK?.game?.gameplayStop) {
      try {
        window.CrazyGames.SDK.game.gameplayStop();
      } catch (e) {
        console.warn('[CrazyGames SDK] gameplayStop error:', e);
      }
    }
  }

  /**
   * Trigger celebratory effects (confetti/cheering) on CrazyGames for major achievements.
   */
  public happytime(): void {
    if (this.isAvailable && window.CrazyGames?.SDK?.game?.happytime) {
      try {
        window.CrazyGames.SDK.game.happytime();
      } catch (e) {
        console.warn('[CrazyGames SDK] happytime error:', e);
      }
    }
  }

  /**
   * Request a midgame or rewarded video ad.
   * In standalone or blocked mode, automatically grants reward after brief delay.
   */
  public requestAd(
    type: 'midgame' | 'rewarded',
    callbacks?: {
      adStarted?: () => void;
      adFinished?: () => void;
      adError?: (error: any) => void;
    }
  ): void {
    if (this.isAvailable && window.CrazyGames?.SDK?.ad?.requestAd) {
      try {
        window.CrazyGames.SDK.ad.requestAd(type, {
          adStarted: () => {
            try { callbacks?.adStarted?.(); } catch (e) { console.warn(e); }
          },
          adFinished: () => {
            try { callbacks?.adFinished?.(); } catch (e) { console.warn(e); }
          },
          adError: (err) => {
            console.warn('[CrazyGames SDK] Ad error, executing fallback finish:', err);
            try { callbacks?.adError?.(err); } catch (e) { console.warn(e); }
            try { callbacks?.adFinished?.(); } catch (e) { console.warn(e); }
          },
        });
      } catch (e) {
        console.warn('[CrazyGames SDK] Failed to invoke requestAd:', e);
        try { callbacks?.adFinished?.(); } catch (err) { console.warn(err); }
      }
    } else {
      // Standalone / fallback mode
      console.log(`[CrazyGames SDK Standalone] Simulating ${type} ad request.`);
      try { callbacks?.adStarted?.(); } catch (e) { console.warn(e); }
      setTimeout(() => {
        try { callbacks?.adFinished?.(); } catch (e) { console.warn(e); }
      }, 300);
    }
  }

  /**
   * Save persistent key-value data. Uses CrazyGames Cloud Save when available,
   * with automatic mirroring to localStorage.
   */
  public async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage setItem failed', e);
    }

    if (this.isAvailable && window.CrazyGames?.SDK?.data?.setItem) {
      try {
        await window.CrazyGames.SDK.data.setItem(key, value);
      } catch (e) {
        console.warn('[CrazyGames SDK] Cloud save setItem failed:', e);
      }
    }
  }

  /**
   * Retrieve persistent key-value data.
   */
  public async getItem(key: string): Promise<string | null> {
    if (this.isAvailable && window.CrazyGames?.SDK?.data?.getItem) {
      try {
        const cloudData = await window.CrazyGames.SDK.data.getItem(key);
        if (cloudData !== null && cloudData !== undefined) {
          return cloudData;
        }
      } catch (e) {
        console.warn('[CrazyGames SDK] Cloud save getItem failed, falling back to localStorage:', e);
      }
    }

    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  /**
   * Remove persistent key-value data.
   */
  public async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage removeItem failed', e);
    }

    if (this.isAvailable && window.CrazyGames?.SDK?.data?.removeItem) {
      try {
        await window.CrazyGames.SDK.data.removeItem(key);
      } catch (e) {
        console.warn('[CrazyGames SDK] Cloud save removeItem failed:', e);
      }
    }
  }

  /**
   * Synchronize saved cloud data from CrazyGames SDK into localStorage
   */
  public async syncCloudSaveToLocal(): Promise<void> {
    if (!this.isAvailable || !window.CrazyGames?.SDK?.data?.getItem) {
      return;
    }

    const keysToSync = [
      'game_unlocked_achievements',
      'highest_room',
      'game_equipped_skin',
      'consecutive_no_damage_campaign',
      'surv_turret_killed_15_in_5s'
    ];

    for (const key of keysToSync) {
      try {
        const cloudVal = await window.CrazyGames.SDK.data.getItem(key);
        if (cloudVal !== null && cloudVal !== undefined && cloudVal !== '') {
          localStorage.setItem(key, cloudVal);
        }
      } catch (e) {
        console.warn(`[CrazyGames SDK] Syncing key ${key} failed:`, e);
      }
    }
    console.log('[CrazyGames SDK] Cloud progress synced to local storage successfully.');
  }

  /**
   * Fetch current CrazyGames user info if logged in.
   */
  public async fetchUser(): Promise<{ username?: string; id?: string } | null> {
    if (this.isAvailable && window.CrazyGames?.SDK?.user?.getUser) {
      try {
        const user = await window.CrazyGames.SDK.user.getUser();
        if (user) {
          this.currentUser = user;
          return user;
        }
      } catch (e) {
        console.warn('[CrazyGames SDK] getUser error:', e);
      }
    }
    return null;
  }

  public getCurrentUser() {
    return this.currentUser;
  }

  public isSDKAvailable(): boolean {
    return this.isAvailable;
  }
}

export const crazyGames = new CrazyGamesService();
